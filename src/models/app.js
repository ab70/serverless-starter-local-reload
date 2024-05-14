const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("../db");

const getAppById = async (appId) => {
    const appCollection = (await connectToDatabase()).collection("app");
    return (await appCollection.find({ appId }).toArray())[0];
};

const addApp = async (data) => {
    const appCollection = (await connectToDatabase()).collection("app");
    return await appCollection.insertOne(data);
};

const updateAppByAppId = async (appId, data) => {
    const appCollection = (await connectToDatabase()).collection("app");
    return await appCollection.updateOne(
        { appId: appId },
        { $set: data },
        { new: true }
    );
};

const updateAppById = async (id, data) => {
    const appCollection = (await connectToDatabase()).collection("app");
    await appCollection.updateOne({ _id: new ObjectId(id) }, { $set: data });
    return appCollection.findOne({ _id: new ObjectId(id) });
};

module.exports = {
    getAppById,
    addApp,
    updateAppByAppId,
    updateAppById
};
