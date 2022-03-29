const clientId = "583bd2f127674b06b51ab30d08fbc030";
const redirectUri = "http://localhost:3000/";

let accessToken;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    //Check for access token match
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    // If the access token and expiration time are in the URL, implement the following steps:
    if (accessTokenMatch && expiresInMatch) {
      // Set the access token value
      accessToken = accessTokenMatch[1];

      // Set a variable for expiration time
      // Set the access token to expire at the value for expiration time
      const expiresIn = Number(expiresInMatch[1]);

      // Clear the parameters from the URL, so the app doesn’t try grabbing the access token after it has expired
      window.setTimeout(() => (accessToken = ""), expiresIn * 1000);
      window.history.pushState("Access Token", null, "/");
      return accessToken;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
      window.location = accessUrl;
    }
  },
  //create a method that accepts a search term input, passes the search term value to a Spotify request, then returns the response as a list of tracks in JSON format
  search(term) {
    const accessToken = Spotify.getAccessToken();
    //start the promise chain by returning a GET request (using fetch()) to the Spotify endpoint
    //Add an Authorization header to the request containing the access token
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json(); //Convert the returned response to JSON
        } else {
          console.log("API request failed");
        }
      }) //map the converted JSON to an array of tracks. If the JSON does not contain any tracks, return an empty array.
      .then((jsonResponse) => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri,
        }));
      });
  },

  savePlaylist(name, trackUris) {
    /* The .savePlaylist() method accepts a playlist name and an array of track URIs. It makes the following three requests to the Spotify API:
    1. GET current user’s ID
    2. POST a new playlist with the input name to the current user’s Spotify account. Receive the playlist ID back from the request.
    3. POST the track URIs to the newly-created playlist, referencing the current user’s account (ID) and the new playlist (ID)
    */
    if (!name || !trackUris.length) {
      return;
    }
    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    let userId;

    //Make a request that returns the user’s Spotify username
    return fetch("https://api.spotify.com/v1/me", { headers: headers })
      .then((response) => response.json())
      .then((jsonResponse) => {
        userId = jsonResponse.id;
        //Use the returned user ID to make a POST request that creates a new playlist in the user’s account and returns a playlist ID
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
          headers: headers,
          method: "POST",
          body: JSON.stringify({ name: name }), //Set the playlist name to the value passed into the method
        })
          .then((response) => response.json())
          .then((jsonResponse) => {
            const playlistId = jsonResponse.id;
            return fetch(
              `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
              {
                headers: headers,
                method: "POST",
                body: JSON.stringify({ uris: trackUris }),
              }
            );
          });
      });
  },
};

export default Spotify;
