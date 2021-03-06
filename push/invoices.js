const broadcastResponse = require('./broadcast_response');
const subscribeToInvoices = require('./../lightning/subscribe_to_invoices');

const invoiceUpdate = 'invoice_updated';
const {isArray} = Array;

/** Subscribe to invoices.

  {
    lnd: <Authenticated LND gRPC API Object>
    log: <Log Function>
    wss: [<Web Socket Server Object>]
  }

  @throws
  <Error> on invalid arguments
*/
module.exports = ({lnd, log, wss}) => {
  if (!lnd) {
    throw new Error('ExpectedLndObjectToSubscribeToInvoices');
  }

  if (!log) {
    throw new Error('ExpectedLogFunctionWhenSubscribingToInvoices');
  }

  if (!isArray(wss)) {
    throw new Error('ExpectedWebSocketServersToForwardInvoicesTo');
  }

  const subscription = subscribeToInvoices({lnd});

  subscription.on(invoiceUpdate, row => broadcastResponse({log, row, wss}));

  subscription.on('end', () => {});
  subscription.on('error', err => log([503, 'SubscribeInvoicesErr', {err}]));
  subscription.on('status', ({}) => {});

  return;
};
