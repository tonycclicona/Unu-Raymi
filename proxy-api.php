<?php
// ==============================================================================
// Unu-Raymi API Gateway / Proxy (api.unu-raymi.com -> Node.js)
// Maneja peticiones de API y sirve directamente archivos estáticos de /uploads/
// ==============================================================================

@error_reporting(0);
@ini_set('display_errors', '0');

// ── 0. Prevención de bucles infinitos ──────────────────────────────────────────
if (isset($_SERVER['HTTP_X_PROXY_HOP'])) {
    http_response_code(508);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "success" => false,
        "error" => "Loop de proxy detectado.",
        "path" => isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/'
    ]);
    exit(0);
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

$requestMethod = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// ── 1. Puerto de conexión dinámica y sockets hacia Node.js ───────────────────
$portFile = __DIR__ . '/.port';
$portValue = '';
$portCandidates = [
    $portFile,
    '/home/u209525223/domains/api.unu-raymi.com/public_html/.port',
    '/home/u209525223/domains/unu-raymi.com/public_html/api/.port',
    '/home/u209525223/domains/unu-raymi.com/public_html/.port',
    dirname(__DIR__) . '/.port',
    dirname(__DIR__) . '/api/.port'
];

foreach ($portCandidates as $candidate) {
    if (@file_exists($candidate)) {
        $c = trim(@file_get_contents($candidate));
        if (!empty($c)) {
            $portValue = $c;
            $portFile = $candidate;
            break;
        }
    }
}

// Leer metadatos (.port_meta.json) para recuperar puertos TCP o sockets secundarios
$metaFile = $portFile ? (dirname($portFile) . '/.port_meta.json') : null;
$meta = ($metaFile && @file_exists($metaFile)) ? @json_decode(@file_get_contents($metaFile), true) : [];

$targetPort = is_numeric($portValue) ? intval($portValue) : 0;
if ($targetPort === 0 && !empty($meta['tcp_port']) && is_numeric($meta['tcp_port'])) {
    $targetPort = intval($meta['tcp_port']);
}

// Detectar sockets de usuario accesibles (excluyendo sockets privados de LiteSpeed en /usr/local/lsws/)
$userSocket = null;
$userSocketCandidates = [
    __DIR__ . '/node.sock',
    '/home/u209525223/domains/unu-raymi.com/public_html/api/node.sock',
    dirname(__DIR__) . '/node.sock',
    dirname(__DIR__) . '/api/node.sock'
];
if (!empty($meta['user_socket'])) {
    array_unshift($userSocketCandidates, $meta['user_socket']);
}
foreach ($userSocketCandidates as $sc) {
    if (@file_exists($sc) && @is_readable($sc)) {
        $userSocket = $sc;
        break;
    }
}

// Objetivos de conexión dinámicos y seguros para Hostinger
$targets = [];
// Prioridad 1: TCP loopback en 127.0.0.1 (totalmente accesible a PHP bajo CloudLinux CageFS)
if ($targetPort > 0) {
    $targets[] = "http://127.0.0.1:$targetPort";
}
// Prioridad 2: Socket Unix en espacio del usuario (permisos 0777 en carpeta de usuario)
if ($userSocket) {
    $targets[] = "unix://" . $userSocket;
}
// Prioridad 3: Socket especificado en .port si NO es privado de LiteSpeed
$isPrivateLswsSocket = (strpos($portValue, '/usr/local/lsws') === 0);
if (!$isPrivateLswsSocket && (strpos($portValue, '/') === 0 || strpos($portValue, '.sock') !== false)) {
    if (@file_exists($portValue) && @is_readable($portValue)) {
        $targets[] = "unix://" . $portValue;
    }
}
// Prioridad 4: localhost si targetPort > 0
if ($targetPort > 0 && !in_array("http://localhost:$targetPort", $targets)) {
    $targets[] = "http://localhost:$targetPort";
}

// ── 2. Diagnóstico avanzado en tiempo real (?diag=1) ─────────────────────────
if (isset($_GET['diag']) || isset($_GET['diagnostic'])) {
    header("Content-Type: application/json; charset=UTF-8");
    $targetProbes = [];

    foreach ($targets as $tgt) {
        $probeResult = ["target" => $tgt];
        $isUnix = (strpos($tgt, 'unix://') === 0);

        if ($isUnix) {
            $sockPath = substr($tgt, 7);
            $probeResult["exists"] = @file_exists($sockPath);
            $probeResult["readable"] = @is_readable($sockPath);
            $probeResult["writable"] = @is_writable($sockPath);
        } else {
            $parsed = parse_url($tgt);
            $pHost = isset($parsed['host']) ? $parsed['host'] : '127.0.0.1';
            $pPort = isset($parsed['port']) ? intval($parsed['port']) : 80;
            $fp = @fsockopen($pHost, $pPort, $errno, $errstr, 0.3);
            $probeResult["tcp_connect"] = $fp ? "connected" : "failed ($errno: $errstr)";
            if ($fp) @fclose($fp);
        }

        // Test cURL probe rápido (1.5s max)
        if (function_exists('curl_init')) {
            $ch = curl_init();
            $tUrl = $isUnix ? 'http://localhost/api/health' : (rtrim($tgt, '/') . '/api/health');
            curl_setopt($ch, CURLOPT_URL, $tUrl);
            if ($isUnix) {
                curl_setopt($ch, CURLOPT_UNIX_SOCKET_PATH, substr($tgt, 7));
            }
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
            curl_setopt($ch, CURLOPT_TIMEOUT, 2);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ["Host: api.unu-raymi.com", "X-Proxy-Hop: 1"]);
            $startTime = microtime(true);
            $probeResp = curl_exec($ch);
            $durationMs = round((microtime(true) - $startTime) * 1000, 2);
            $probeCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $probeErr = curl_error($ch);
            curl_close($ch);

            $probeResult["probe_http_code"] = $probeCode;
            $probeResult["probe_duration_ms"] = $durationMs;
            if ($probeErr) $probeResult["probe_error"] = $probeErr;
            if ($probeResp) $probeResult["probe_sample"] = substr($probeResp, 0, 100);
        }

        $targetProbes[] = $probeResult;
    }

    echo json_encode([
        "status" => "ok",
        "service" => "Unu-Raymi API Gateway",
        "api_directory" => __DIR__,
        "port_file" => $portFile,
        "port_file_exists" => @file_exists($portFile),
        "port_value_raw" => $portValue,
        "target_port" => $targetPort,
        "user_socket" => $userSocket,
        "runtime_meta" => $meta,
        "connection_targets" => $targets,
        "target_probes" => $targetProbes,
        "curl_available" => function_exists('curl_init'),
        "server_software" => isset($_SERVER['SERVER_SOFTWARE']) ? $_SERVER['SERVER_SOFTWARE'] : null,
        "timestamp" => date("c")
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit(0);
}

// ── 3. Normalización de URI ──────────────────────────────────────────────────
$requestUri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
$uriPath = parse_url($requestUri, PHP_URL_PATH) ?: '/';

// ── 3.1 Entrega directa de /uploads/ desde el disco ──────────────────────────
if (strpos($uriPath, '/uploads/') === 0) {
    $filename = basename($uriPath);
    $possibleDirs = [
        // Prioridad: storage del subdominio api.unu-raymi.com
        '/home/u209525223/domains/api.unu-raymi.com/storage/uploads',
        // Storage compartido de unu-raymi.com
        '/home/u209525223/domains/unu-raymi.com/storage/uploads',
        // Fallback: public_html del dominio principal
        '/home/u209525223/domains/unu-raymi.com/public_html/uploads',
        // Fallback: api subfolder dentro de public_html
        '/home/u209525223/domains/unu-raymi.com/public_html/api/uploads',
        // Rutas relativas del repositorio
        __DIR__ . '/../uploads',
        __DIR__ . '/uploads',
        dirname(__DIR__) . '/backend/storage/uploads',
        dirname(__DIR__) . '/storage/uploads',
        dirname(dirname(__DIR__)) . '/backend/storage/uploads'
    ];

    foreach ($possibleDirs as $dir) {
        $filePath = rtrim($dir, '/') . '/' . $filename;
        if (@file_exists($filePath) && @is_file($filePath)) {
            $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mimes = [
                'webp' => 'image/webp',
                'jpg'  => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png'  => 'image/png',
                'gif'  => 'image/gif',
                'svg'  => 'image/svg+xml',
                'pdf'  => 'application/pdf',
                'ico'  => 'image/x-icon'
            ];
            $cType = isset($mimes[$ext]) ? $mimes[$ext] : (@mime_content_type($filePath) ?: 'application/octet-stream');
            header("Content-Type: $cType");
            header("Content-Length: " . filesize($filePath));
            header("Cache-Control: public, max-age=604800, immutable");
            header("Access-Control-Allow-Origin: *");
            @readfile($filePath);
            exit(0);
        }
    }
}

// Prefijar con /api si la petición es a rutas desnudas (ej: /health, /tours)
if (strpos($uriPath, '/api') !== 0 && strpos($uriPath, '/uploads') !== 0) {
    $requestUri = '/api' . (strpos($requestUri, '/') === 0 ? '' : '/') . $requestUri;
}

// ── 4. Cabeceras y cuerpo ───────────────────────────────────────────────────
$headers = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        $lower = strtolower($name);
        if ($lower !== 'host' && $lower !== 'accept-encoding' && $lower !== 'content-length') {
            $headers[] = "$name: $value";
        }
    }
}

$isMultipart = !empty($_FILES) || (isset($_SERVER['CONTENT_TYPE']) && strpos(strtolower($_SERVER['CONTENT_TYPE']), 'multipart/form-data') !== false);
$postFields = null;
$body = null;

if ($isMultipart) {
    $postFields = $_POST;
    foreach ($_FILES as $field => $fileData) {
        if (is_array($fileData['tmp_name'])) {
            foreach ($fileData['tmp_name'] as $idx => $tmpName) {
                if (!empty($tmpName) && is_uploaded_file($tmpName) && $fileData['error'][$idx] === UPLOAD_ERR_OK) {
                    $postFields[$field . '[' . $idx . ']'] = new CURLFile(
                        $tmpName,
                        $fileData['type'][$idx] ?: 'application/octet-stream',
                        $fileData['name'][$idx]
                    );
                }
            }
        } else {
            if (!empty($fileData['tmp_name']) && is_uploaded_file($fileData['tmp_name']) && $fileData['error'] === UPLOAD_ERR_OK) {
                $postFields[$field] = new CURLFile(
                    $fileData['tmp_name'],
                    $fileData['type'] ?: 'application/octet-stream',
                    $fileData['name']
                );
            }
        }
    }
} else {
    $body = file_get_contents('php://input');
}

// ── 5. Proxy hacia Node.js ────────────────────────────────────────────────────
$httpCode = 0;
$response = false;
$contentType = '';
$lastError = '';

if (function_exists('curl_init') && !empty($targets)) {
    foreach ($targets as $baseTarget) {
        $isUnix = (strpos($baseTarget, 'unix://') === 0);
        if ($isUnix) {
            $socketPath = substr($baseTarget, 7);
            $url = 'http://localhost' . $requestUri;
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_UNIX_SOCKET_PATH, $socketPath);
        } else {
            $url = rtrim($baseTarget, '/') . $requestUri;
            $ch = curl_init($url);
        }

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $requestMethod);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $reqHeaders = $headers;
        $reqHeaders[] = "X-Forwarded-Host: api.unu-raymi.com";
        $reqHeaders[] = "Host: api.unu-raymi.com";
        $reqHeaders[] = "X-Proxy-Hop: 1";

        if ($isMultipart) {
            $filteredHeaders = array_filter($reqHeaders, function($h) {
                $lh = strtolower($h);
                return strpos($lh, 'content-type:') !== 0 && strpos($lh, 'content-length:') !== 0;
            });
            curl_setopt($ch, CURLOPT_HTTPHEADER, array_values($filteredHeaders));
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        } else {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);
            if ($body !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            }
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $lastError = curl_error($ch);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 500 && $response !== false) {
            // Si es petición a /api/ pero responde text/html, seguir con el siguiente target
            if (strpos($uriPath, '/api') === 0 && strpos(strtolower($contentType), 'text/html') !== false) {
                continue;
            }
            break;
        }
    }
}

// ── 6. Despacho de respuesta ─────────────────────────────────────────────────
if ($httpCode > 0 && $response !== false) {
    if (strpos($uriPath, '/uploads/') === 0 && (strpos(strtolower($contentType), 'text/html') !== false)) {
        http_response_code(404);
        header("Content-Type: text/plain; charset=UTF-8");
        echo "Archivo no encontrado.";
        exit(0);
    }

    if ($contentType) {
        header("Content-Type: $contentType");
    }
    http_response_code($httpCode);
    echo $response;
    exit(0);
}

// Error 502 si ningún canal responde
header("Content-Type: application/json; charset=UTF-8");
http_response_code(502);
echo json_encode([
    "success" => false,
    "error" => "El servidor Node.js de Unu-Raymi no está respondiendo. Verifica que la aplicación Node.js esté activa en Hostinger hPanel.",
    "path" => $requestUri,
    "targets_attempted" => $targets,
    "last_error" => $lastError ?: "No se pudo conectar con los objetivos dinámicos locales",
    "timestamp" => date("c")
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit(0);
