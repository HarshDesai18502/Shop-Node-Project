const mongoose = require('mongoose');

const {Schema} = mongoose;

const OrderSchema = new Schema({
  products: [
    {
      product: { type: Object }
    }
  ],
  user: {
    email: {
      type: String
    },
    userId: {
      type: Schema.Types.ObjectId,

      ref: 'User'
    }
  }
});

module.exports = mongoose.model('Order', OrderSchema);
