const asyncAuto = require('async/auto');
const {returnResult} = require('asyncjs-util');

const {decodePaymentRequest} = require('./../');
const {getInvoice} = require('./../');
const {getWalletInfo} = require('./../');

/** Get payment request

  {
    lnd: <Authenticated LND gRPC API Object>
    request: <BOLT 11 Payment Request String>
  }

  @returns via cbk or Promise
  {
    description: <Description String>
    destination: <Public Key String>
    expires_at: <ISO 8601 Date String>
    id: <Payment Request Hash String>
    [is_confirmed]: <Settled Bool>
    [is_outgoing]: <Is Outgoing Bool>
    [secret]: <Payment Preimage Hex String>
    tokens: <Token Amount Number>
  }
*/
module.exports = ({lnd, request}, cbk) => {
  return new Promise((resolve, reject) => {
    return asyncAuto({
      // Check arguments
      validate: cbk => {
        if (!lnd) {
          return cbk([400, 'ExpectedLndForInvoiceDetailsLookup']);
        }

        if (!request) {
          return cbk([400, 'ExpectedPaymentRequestForInvoiceDetailsLookup']);
        }

        return cbk();
      },

      // Get the decoded payment request
      decodedPaymentRequest: ['validate', ({}, cbk) => {
        return decodePaymentRequest({lnd, request}, cbk);
      }],

      // Get wallet info
      getWalletInfo: ['validate', ({}, cbk) => {
        return getWalletInfo({lnd}, cbk);
      }],

      // Get extended invoice details if this is one of our own invoices
      getInvoice: ['decodedPaymentRequest', 'getWalletInfo', (res, cbk) => {
        const {destination} = res.decodedPaymentRequest;
        const {id} = res.decodedPaymentRequest;

        // Exit early when no information on the payment request is available.
        if (res.getWalletInfo.public_key !== destination) {
          return cbk(null, {});
        }

        return getInvoice({id, lnd}, cbk);
      }],

      // Final details about the invoice
      invoiceDetails: ['decodedPaymentRequest', 'getInvoice', (res, cbk) => {
        return cbk(null, {
          description: res.decodedPaymentRequest.description,
          destination: res.decodedPaymentRequest.destination,
          expires_at: res.decodedPaymentRequest.expires_at,
          id: res.decodedPaymentRequest.id,
          is_confirmed: res.getInvoice.is_confirmed,
          is_outgoing: res.getInvoice.is_outgoing,
          secret: res.getInvoice.secret,
          tokens: res.decodedPaymentRequest.tokens,
        });
      }],
    },
    returnResult({reject, resolve, of: 'invoiceDetails'}, cbk));
  });
};
