import { Client } from "@googlemaps/google-maps-services-js";
const client = new Client({});
const latitude = 40.793919; // Example latitude
const longitude = -73.972323; // Example longitude

export const reverseGeocode = (latitude, longitude) => {
  client
    .reverseGeocode({
      params: {
        latlng: `${latitude},${longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 1000, // milliseconds
    })
    .then((r) => {
      console.log(r.data.results[0].formatted_address);
    })
    .catch((e) => {
      console.log(e.response.data.error_message);
    });
};
