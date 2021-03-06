const asyncAuto = require('async/auto');
const {returnResult} = require('asyncjs-util');
const {sortBy} = require('lodash');

const {getInvoices} = require('./../');
const {getPayments} = require('./../');
const {getChainTransactions} = require('./../');

/** Get history: a combination of chain transactions, invoices and payments.

  {
    lnd: <Authenticated LND gRPC API Object>
  }

  @returns via cbk
  {
    history: [{
      [block_id]: <Block Hash String>
      chain_address: <Fallback Chain Address String>
      [confirmation_count]: <Confirmation Count Number>
      [confirmed_at]: <Settled at ISO 8601 Date String>
      created_at: <ISO 8601 Date String>
      [description]: <Description String>
      [description_hash]: <Description Hash Hex String>
      [destination]: <Compressed Public Key String>
      [expires_at]: <ISO 8601 Date String>
      fee: <Tokens Number>
      [hop_count]: <Route Hops Number>
      id: <Id String>
      [is_confirmed]: <Invoice is Confirmed Bool>
      [is_outgoing]: <Invoice is Outgoing Bool>
      request: <BOLT 11 Payment Request String>
      tokens: <Tokens Number>
    }]
}
*/
module.exports = ({lnd}, cbk) => {
  return asyncAuto({
    // Get incoming invoices
    getInvoices: async cbk => getInvoices({lnd}),

    // Get outgoing payments
    getPayments: async cbk => getPayments({lnd}),

    // Get chain transactions
    getTransactions: async cbk => getChainTransactions({lnd}),

    // Combined history
    history: ['getInvoices', 'getPayments', 'getTransactions', (res, cbk) => {
      const allTransactions = []
        .concat(res.getInvoices.invoices)
        .concat(res.getPayments.payments)
        .concat(res.getTransactions.transactions);

      return cbk(null, {
        history: sortBy(allTransactions, ['created_at']).reverse(),
      });
    }],
  },
  returnResult({of: 'history'}, cbk));
};
