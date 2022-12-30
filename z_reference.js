//-- Middlware runs top to bottom --//

//-- ***** ***** ***** Reference ***** ***** ***** --//
// router.post()
// router.delete()

//-- Path variable, multiple methods --//
// router
//   .route("/:userId")
//   .get(ctrl.getUserIdData)
//   .put(ctrl.putUserIdData)
//   .delete(ctrl.deleteUserIdData);

//-- parms middleware --//
// router.param("userId", (req, res, next, userId) => {
//   console.log(userId);
//   next()
// });
