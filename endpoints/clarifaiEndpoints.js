// Clarifai API moved from client to server to hide API key etc.
// Calls Clarifai face-detection API. Parses output response. 
// Calculates Bounding Box and sends back to client.
export async function postClarifaiFaceDetection(req, res) {
  console.log("\n>>>BODY: ", req.body);
  const { url, height, width } = req.body;
  const CLARIFAIURL = process.env.CLARIFAI_URL;
  try {
    const response = await fetch(CLARIFAIURL, generateClarifaiRequest(url));
    console.log('response', response);
    const jsonResponse = await response.json();

    // For all bounding boxes found in the json, convert them into calculated objects and put into array
    const boundingBoxes = jsonResponse.outputs[0].data.regions.map(region => {
      return calculateFaceLocation(height, width, region.region_info.bounding_box);
    });
    res.status(200).json(boundingBoxes);
  }
  catch (error) {
    res.status(400).json('Clarifai API error');
  }
}

// Given a URL and the static config, generates a requestOptions object, used in the fetch API
function generateClarifaiRequest(url) {
  const PAT_KEY = process.env.CLARIFAI_PATKEY;
  const USER_ID = process.env.CLARIFAI_USERID;
  const APP_ID = process.env.CLARIFAI_APPID;
  console.log('appid', APP_ID);

  return {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Key ' + PAT_KEY
    },
    body: JSON.stringify({
      "user_app_id": {
        "user_id": USER_ID,
        "app_id": APP_ID
      },
      "inputs": [{
        "data": { "image": { "url": url } }
      }]
    })
  };
}

// Convert percentages to pixel locations of image bounding boxes
function calculateFaceLocation(height, width, box) {
  return {
    leftCol: Math.round(box.left_col * width),
    topRow: Math.round(box.top_row * height),
    rightCol: Math.round(width - (box.right_col * width)),
    bottomRow: Math.round(height - (box.bottom_row * height))
  }
}



export default {
  postClarifaiFaceDetection
}