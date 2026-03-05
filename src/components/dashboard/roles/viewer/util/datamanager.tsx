// API base URL - uses relative path for EC2 deployment (nginx proxies to tile-server)
// Falls back to localhost for local development
const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // On EC2: nginx proxies /api/fastapi to tile-server:3000
      return '/api/fastapi';
    }
    // Local development
    return 'http://localhost:8000/api/fastapi';
  };
  
  const fetchData = async (pathT: string, method: string = 'GET', contentType: string = 'application/json') => {
    const API_BASE_URL = getApiBaseUrl();
    const path = `${API_BASE_URL}/${pathT}`;
  
    return new Promise((resolve, reject) => {
      fetch(path, {
        method: method,
        headers: {
          'Content-Type': contentType
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response;
        })
        .then((data) => {
          if (contentType === 'application/json') {
            resolve(data.json());
          } else {
            resolve(data);
          }
        })
        .catch((error) => {
          console.error('There was a problem with the fetch operation: ', error);
          reject(error);
        });
    });
  };
  
  // Get tile server base URL for OpenSeadragon
  export const getTileServerUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // On EC2: nginx proxies /tiles to tile-server:3000
      return '/tiles';
    }
    return 'http://localhost:8000';
  };
  
  export default { fetchData, getTileServerUrl };