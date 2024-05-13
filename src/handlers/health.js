const healthcheck = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: "This is from healths",
                // input: event,
            },
            null,
            2
        ),
    };
};

module.exports = { healthcheck }