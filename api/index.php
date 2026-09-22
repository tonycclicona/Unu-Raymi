<?php
// ==============================================================================
// Unu-Raymi API Gateway / Proxy (api.unu-raymi.com -> Node.js Passenger)
// Maneja peticiones de API y sirve directamente archivos estáticos de /uploads/
// ==============================================================================

@error_reporting(0);
@ini_set('display_errors', '0');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

$requestMethod = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// ── 1. Puerto de conexión dinámica hacia Node.js ───────────────────────────────
$portFile = __DIR__ . '/.port';
$targetPort = 4000;
if (@file_exists($portFile)) {
    $p = intval(trim(@file_get_contents($portFile)));
    if ($p > 0) {
        $targetPort = $p;
    }
}

// Objetivos de conexión:
// Primero conectar directamente con el proceso Passenger en unu-raymi.com,
// y como respaldo intentar el puerto local 127.0.0.1
$targets = [
    "https://unu-raymi.com",
    "http://127.0.0.1:$targetPort",
    "http://localhost:$targetPort"
];

// ── 2. Diagnóstico simple (?diag=1) ──────────────────────────────────────────
if (isset($_GET['diag']) || isset($_GET['diagnostic'])) {
    header("Content-Type: application/json; charset=UTF-8");
    $fp = @fsockopen('127.0.0.1', $targetPort, $errno, $errstr, 0.2);
    $socketConnected = false;
    if ($fp) {
        $socketConnected = true;
        @fclose($fp);
    }

    echo json_encode([
        "status" => "ok",
        "api_directory" => __DIR__,
        "port_file" => $portFile,
        "port_file_exists" => @file_exists($portFile),
        "target_port" => $targetPort,
        "socket_open" => $socketConnected,
        "targets" => $targets,
        "curl_available" => function_exists('curl_init'),
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
        __DIR__ . '/uploads',
        '/home/u209525223/domains/unu-raymi.com/public_html/api/uploads',
        '/home/u209525223/domains/unu-raymi.com/public_html/uploads',
        __DIR__ . '/../uploads',
        dirname(__DIR__) . '/storage/uploads',
        dirname(__DIR__) . '/backend/storage/uploads',
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
            @readfile($filePath);
            exit(0);
        }
    }
}

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

if (function_exists('curl_init')) {
    foreach ($targets as $baseTarget) {
        $url = rtrim($baseTarget, '/') . $requestUri;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $requestMethod);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $reqHeaders = $headers;
        if (strpos($baseTarget, 'unu-raymi.com') !== false) {
            $reqHeaders[] = "Host: unu-raymi.com";
        } else {
            $reqHeaders[] = "Host: api.unu-raymi.com";
        }

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
            // Si es petición a /api/ pero responde text/html, es un fallback erróneo de LiteSpeed, seguir con el siguiente target
            if (strpos($uriPath, '/api') === 0 && strpos(strtolower($contentType), 'text/html') !== false) {
                continue;
            }
            break;
        }
    }
}

// ── 6. Despacho de respuesta ─────────────────────────────────────────────────
if ($httpCode > 0 && $response !== false) {
    // Si se pidió un archivo de /uploads/ y el backend respondió HTML, retornar 404
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
    "last_error" => $lastError ?: "No se pudo conectar con el servidor Node.js",
    "timestamp" => date("c")
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit(0);
