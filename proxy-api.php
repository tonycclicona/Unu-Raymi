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

$requestUri = $_SERVER['REQUEST_URI'];
if (strpos($requestUri, '/api') !== 0) {
    $requestUri = '/api' . $requestUri;
}

$ports = [4000, 3000, 8080];
$response = false;
$httpCode = 0;
$contentType = '';

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}
$headers[] = "Host: api.unu-raymi.com";

$body = null;
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
}

foreach ($ports as $port) {
    $targetUrl = 'http://127.0.0.1:' . $port . $requestUri;
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($httpCode > 0 && $response !== false) {
        break;
    }
}

if ($httpCode > 0 && $response !== false) {
    if ($contentType) {
        header("Content-Type: $contentType");
    }
    http_response_code($httpCode);
    echo $response;
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");
http_response_code(502);
echo json_encode([
    "success" => false,
    "error" => "El servidor Node.js de Unu-Raymi no está respondiendo en los puertos locales (4000/3000). Asegúrate de iniciar la aplicación Node.js en el panel de Hostinger.",
    "path" => $requestUri,
    "timestamp" => date("c")
]);
exit(0);
