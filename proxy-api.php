<?php
// ==============================================================================
// Unu-Raymi API Dynamic Reverse Proxy (LiteSpeed / PHP -> Node.js Gateway)
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

// Si es una petición OPTIONS (Preflight de CORS para el login), respondemos OK de inmediato
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$requestUri = $_SERVER['REQUEST_URI'];
if (strpos($requestUri, '/api') !== 0) {
    $requestUri = '/api' . $requestUri;
}

// Redirigir el tráfico al puerto interno donde corre tu servidor de Node (Backend)
// Asumimos el puerto 4000 que es el estándar de tu server.js
$targetUrl = 'http://127.0.0.1:4000' . $requestUri;

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}
// Forzamos el host original para evitar rechazos
$headers[] = "Host: api.unu-raymi.com";
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

curl_close($ch);

if ($contentType) {
    header("Content-Type: $contentType");
}
http_response_code($httpCode ?: 200);
echo $response;
exit(0);
