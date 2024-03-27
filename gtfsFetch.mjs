import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import fetch from "node-fetch";
import fs from "fs";
import csv from "csv-parser";
import moment from "moment";

const feed = await (async () => {
  try {
    const response = await fetch(
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
    );
    if (!response.ok) {
      const error = new Error(
        `${response.url}: ${response.status} ${response.statusText}`,
      );
      error.response = response;
      throw error;
      process.exit(1);
    }
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer),
    );
    return feed;
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();

export const arrivalTimes = (routeId, stopId) => {
  const tripIds = feed.entity
    .filter(
      (entity) =>
        entity.tripUpdate && entity.tripUpdate.trip.routeId === routeId,
    )
    .map((entity) => entity.tripUpdate.trip.tripId);

  return new Promise((resolve, reject) => {
    let arrivalTimes = [];
    fs.createReadStream("google_transit/stops.txt")
      .pipe(csv())
      .on("data", (row) => {
        if (row.stop_id === stopId) {
          // Filter the trip updates to find the ones that match the stop_sequence
          let matchingTrips = [];
          for (let entity of feed.entity) {
            if (tripIds.includes(entity.tripUpdate?.trip?.tripId)) {
              entity.tripUpdate.stopTimeUpdate.map((update) => {
                //console.log(update);
                if (update.stopId === stopId) {
                  // console.log(entity);
                  matchingTrips.push(entity);
                }
              });
            }
          }
          // Calculate the expected arrival times
          matchingTrips.forEach((trip) => {
            const update = trip.tripUpdate.stopTimeUpdate.find(
              (update) => update.stopId === stopId,
            );
            const scheduledArrivalTime = moment.unix(update.arrival.time);
            const expectedArrivalTime = scheduledArrivalTime.add(
              update.arrival.delay,
              "seconds",
            );
            arrivalTimes.push(
              `Train ${routeId} is expected to arrive at ${row.stop_name} at ${expectedArrivalTime.format("HH:mm:ss")}`,
            );
          });
        }
      })
      .on("end", () => {
        console.log("CSV file successfully processed");
        resolve(arrivalTimes);
      })
      .on("error", (error) => {
        console.log("Error:", error);
        reject(error);
      });
  });
};
