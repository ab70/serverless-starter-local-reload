const { connectToDatabase } = require("../db");

const getAppInfo = async () => {
    const AppInfoCollection = (await connectToDatabase()).collection("appInfo");
    return (await AppInfoCollection.find().toArray())[0];
}

module.exports = {
    getAppInfo
}
