import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

//This method calls the Google Maps API to get the coordinates of the address specified in the parameter
async function getCoordinates(address) {
  
    let {lat,lng} = await client
    .geocode({
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 1000, 
    })
    .then((res) => {
        const {lat, lng} = res.data.results[0].geometry.location
        return {lat, lng}
    })
    .catch((e) => {
      return null;
    });

    return {lat, lng};
}

export { getCoordinates };
