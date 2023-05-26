//-- Lazy Migration to add last_edited --//
// const bulkUpdateOperations = [];
const bulkUpdateOperations: { updateOne: { filter: any; update: any } }[] = [];
for (let conversation of conversationsArray) {
  //-- If no 'last_edited', use time of last API req. --//
  if (!conversation.last_edited) {
    conversation.api_req_res_metadata.sort((a, b) => {
      const timestampA = new Date(a.created_at).getTime();
      const timestampB = new Date(b.created_at).getTime();
      return timestampB - timestampA; //-- Descending --//
    });
    const newestMetadata = conversation.api_req_res_metadata[0];

    //-- Update in conversationsArray --//
    conversation.last_edited = new Date(newestMetadata.created_at);

    //-- Add to bulkWrite array to update MongoDB --//
    bulkUpdateOperations.push({
      updateOne: {
        filter: { _id: conversation._id },
        update: { $set: { last_edited: conversation.last_edited } },
      },
    });
  }
}

//-- Execute bulk write --//
if (bulkUpdateOperations.length > 0) {
  try {
    await retry(
      async () => {
        await Mongo.conversations.bulkWrite(bulkUpdateOperations);
      },
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
  }
}
