const databaseList = await MongoClient.db().admin().listDatabases();
console.log("Databases: ");
databaseList.databases.forEach((db) => console.log(` - ${db.name}`));

const collectionsList = await MongoClient.db("chrtgpt-journal")
  .listCollections()
  .toArray();
console.log("chrtgpt-journal collections:");
collectionsList.forEach((coll) => console.log(coll.name));

try {
  const result = await MongoClient.db("fooDatabase")
    .collection("fooCollection")
    .insertOne({ name: "John Doe", age: 30, city: "Austin", state: "TX" });
  console.log(result);
} catch (err) {
  console.log(err);
}
