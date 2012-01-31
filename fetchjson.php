<?php
header("content-type: application/json"); 

$baseurl = "https://ajax.googleapis.com/ajax/services/search/web?v=1.0&";
$query = $_GET['query'];
// sendRequest
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseurl.$query);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_REFERER, "https://sites.google.com/site/aranlunzer/");
$body = curl_exec($ch);
curl_close($ch);

// now, process the JSON string
//$json = json_decode($body);

// Create a generic object.
// Assign it the property 'message' - the feedback message we want the user to see.
$rtnjsonobj->message = $body;

// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
echo $_GET['callback']. '('. json_encode($rtnjsonobj) . ')';    

?>
