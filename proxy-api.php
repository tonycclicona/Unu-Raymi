<?php
// ==============================================================================
// Unu-Raymi API Dynamic Reverse Proxy (LiteSpeed / PHP -> Node.js Gateway)
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

// Responder inmediatamente a peticiones OPTIONS preflight de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// ── 1. Descubrimiento de puertos y rutas ─────────────────────────────────────
$portFiles = [
    __DIR__ . '/.port',
    __DIR__ . '/../.port',
    __DIR__ . '/../../unu-raymi.com/public_html/.port',
    __DIR__ . '/../../unu-raymi.com/public_html/api/.port',
    __DIR__ . '/../../unu-raymi.com/public_html/backend/.port',
    '/home/u209525223/domains/unu-raymi.com/public_html/.port',
    '/home/u209525223/domains/unu-raymi.com/public_html/api/.port',
    '/home/u209525223/domains/api.unu-raymi.com/public_html/.port',
    '/home/u209525223/.port',
];

$dynamicPorts = [4000, 3000];
$foundPortFiles = [];

foreach ($portFiles as $pf) {
    if (@file_exists($pf)) {
        $raw = @file_get_contents($pf);
        $p = intval(trim($raw));
        if ($p > 0) {
            $foundPortFiles[$pf] = $p;
            if (!in_array($p, $dynamicPorts)) {
                array_unshift($dynamicPorts, $p);
            }
        }
    }
}

// Intentar leer de temp si está permitido
$tmpPort = @sys_get_temp_dir() . '/unu_raymi_port';
if (@file_exists($tmpPort)) {
    $p = intval(trim(@file_get_contents($tmpPort)));
    if ($p > 0 && !in_array($p, $dynamicPorts)) {
        array_unshift($dynamicPorts, $p);
        $foundPortFiles[$tmpPort] = $p;
    }
}

// ── 2. Pre-verificación de sockets disponibles ──────────────────────────────
$openPorts = [];
foreach ($dynamicPorts as $port) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.15);
    if ($fp) {
        $openPorts[] = $port;
        fclose($fp);
    }
}

// Priorizar puertos que respondieron al socket check
$orderedPorts = array_unique(array_merge($openPorts, $dynamicPorts));

$targets = [];
foreach ($orderedPorts as $dp) {
    $targets[] = "http://127.0.0.1:$dp";
    $targets[] = "http://localhost:$dp";
}

// ── 3. Diagnóstico directo con ?diag=1 ──────────────────────────────────────
$isDiag = isset($_GET['diag']) || isset($_GET['diagnostic']);
if ($isDiag) {
    header("Content-Type: application/json; charset=UTF-8");
    $parentDir = dirname(__DIR__);
    $parentFiles = @is_dir($parentDir) ? array_slice(@scandir($parentDir), 0, 30) : [];
    
    $candidateServerJs = [
        $parentDir . '/server.js' => @file_exists($parentDir . '/server.js'),
        '/home/u209525223/domains/unu-raymi.com/public_html/server.js' => @file_exists('/home/u209525223/domains/unu-raymi.com/public_html/server.js'),
        '/home/u209525223/domains/unu-raymi.com/server.js' => @file_exists('/home/u209525223/domains/unu-raymi.com/server.js'),
        '/home/u209525223/public_html/server.js' => @file_exists('/home/u209525223/public_html/server.js'),
        '/home/u209525223/server.js' => @file_exists('/home/u209525223/server.js')
    ];

    $nodeProcess = @shell_exec('ps aux | grep node | grep -v grep');
    $nodeVersion = @shell_exec('node -v 2>&1');

    echo json_encode([
        "proxy_status" => "active",
        "php_version" => PHP_VERSION,
        "script_path" => __FILE__,
        "document_root" => isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : null,
        "parent_dir" => $parentDir,
        "parent_files_sample" => $parentFiles,
        "candidate_server_js" => $candidateServerJs,
        "discovered_port_files" => $foundPortFiles,
        "active_open_ports" => $openPorts,
        "tested_targets" => $targets,
        "node_version_cli" => trim((string)$nodeVersion),
        "node_running_processes" => $nodeProcess ? trim((string)$nodeProcess) : "No running node process detected via ps aux",
        "timestamp" => date("c")
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit(0);
}

// ── 4. Normalización de URI de petición ─────────────────────────────────────
$requestUri = $_SERVER['REQUEST_URI'];
// Remover query strings para la validación de prefijo
$uriPath = parse_url($requestUri, PHP_URL_PATH);

if (strpos($uriPath, '/api') !== 0 && strpos($uriPath, '/uploads') !== 0) {
    $requestUri = '/api' . (strpos($requestUri, '/') === 0 ? '' : '/') . $requestUri;
}

// ── 5. Preparación de cabeceras y cuerpo ────────────────────────────────────
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
} else if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
}

// ── 6. Reenvío cURL a los objetivos disponibles ─────────────────────────────
$response = false;
$httpCode = 0;
$contentType = '';
$curlErrors = [];

foreach ($targets as $baseTarget) {
    $targetUrl = $baseTarget . $requestUri;
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_ENCODING, ''); // Decodifica gzip/deflate automáticamente
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $reqHeaders = $headers;
    $reqHeaders[] = "Host: api.unu-raymi.com";

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
    $err = curl_error($ch);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 500 && $response !== false) {
        break;
    } else if ($err) {
        $curlErrors[$baseTarget] = $err;
    }
}

// ── 7. Respuesta exitosa ────────────────────────────────────────────────────
if ($httpCode > 0 && $response !== false) {
    if ($contentType) {
        header("Content-Type: $contentType");
    }
    http_response_code($httpCode);
    echo $response;
    exit(0);
}

// ── 8. Manejo de error 502 con reporte detallado ────────────────────────────
header("Content-Type: application/json; charset=UTF-8");
http_response_code(502);
echo json_encode([
    "success" => false,
    "error" => "El servidor Node.js de Unu-Raymi no está respondiendo en los puertos locales. Asegúrate de que la aplicación Node.js esté iniciada en el panel de Hostinger.",
    "path" => $requestUri,
    "attempted_targets" => $targets,
    "open_ports_detected" => $openPorts,
    "curl_errors" => $curlErrors,
    "timestamp" => date("c"),
    "help" => "Accede a ?diag=1 en este dominio para ver el informe de diagnóstico completo."
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit(0);
