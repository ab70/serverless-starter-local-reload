const easyResponse = (data = {}, status = 500, message = "") => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
  };
  switch (status) {
    case 200:
      return {
        headers,
        body: JSON.stringify({
          data,
          status,
          message: message ? message : "Function Execution successful"
        })
      };
    case 400:
      return {
        headers,
        body: JSON.stringify({
          status,
          error: message ? message : "Bad Request"
        })
      };
    case 404:
      return {
        headers,
        body: JSON.stringify({
          status,
          error: message ? message : "Not Found"
        })
      };
    case 500:
      return {
        headers,
        body: JSON.stringify({
          error: data ? data : null,
          status,
          message: message ? message : "Internal Server Error"
        })
      };
    default:
      return {
        status: 500,
        headers,
        body: JSON.stringify({
          error: data ? data : null,
          error: "Invalid status code"
        })
      };
  }
};

module.exports = { easyResponse }