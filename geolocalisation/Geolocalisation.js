import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

//TODO: Address should be separated in street, city, country, etc.
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
      console.log("Error while fetching coordinates", e);
    });

    return {lat, lng};
}

export { getCoordinates };
