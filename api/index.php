<?php
// ==============================================================================
// Unu-Raymi API Reverse Proxy (LiteSpeed / PHP -> Node.js)
// Directorio: /home/u209525223/domains/unu-raymi.com/public_html/api
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

// Responder preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// ── 1. Puerto asignado a Node.js ─────────────────────────────────────────────
// El archivo .port se ubica exclusivamente en la carpeta api/
$portFile = __DIR__ . '/.port';
$targetPort = 4000;

if (@file_exists($portFile)) {
    $p = intval(trim(@file_get_contents($portFile)));
    if ($p > 0) {
        $targetPort = $p;
    }
}

$targets = [
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
        fclose($fp);
    }

    echo json_encode([
        "status" => "ok",
        "api_directory" => __DIR__,
        "port_file" => $portFile,
        "port_file_exists" => file_exists($portFile),
        "target_port" => $targetPort,
        "socket_open" => $socketConnected,
        "timestamp" => date("c")
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit(0);
}

// ── 3. Normalización de URI ──────────────────────────────────────────────────
$requestUri = $_SERVER['REQUEST_URI'];
$uriPath = parse_url($requestUri, PHP_URL_PATH);

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
} else if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
}

// ── 5. Reenvío cURL ──────────────────────────────────────────────────────────
$response = false;
$httpCode = 0;
$contentType = '';
$lastError = '';

foreach ($targets as $baseTarget) {
    $targetUrl = $baseTarget . $requestUri;
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_ENCODING, '');
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
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
    $lastError = curl_error($ch);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 500 && $response !== false) {
        break;
    }
}

// ── 6. Despacho de respuesta ─────────────────────────────────────────────────
if ($httpCode > 0 && $response !== false) {
    if ($contentType) {
        header("Content-Type: $contentType");
    }
    http_response_code($httpCode);
    echo $response;
    exit(0);
}

// Error 502 si Node.js no responde en el puerto configurado
header("Content-Type: application/json; charset=UTF-8");
http_response_code(502);
echo json_encode([
    "success" => false,
    "error" => "El servidor Node.js no responde en el puerto $targetPort. Inicia la aplicación Node.js en Hostinger hPanel.",
    "path" => $requestUri,
    "port" => $targetPort,
    "last_error" => $lastError,
    "timestamp" => date("c")
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit(0);
