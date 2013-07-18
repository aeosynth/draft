function(newDoc, oldDoc, userCtx) {
  if (userCtx.name !== 'USERNAME')
    throw({ unauthorized: 'read only' });
}
