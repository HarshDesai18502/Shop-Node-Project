const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    requierd: true
  },
  password: {
    type: String,
    requierd: true
  },
  resetToken: String,
  resetTokenExipration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          requierd: true
        }
      }
    ]
  }
});

userSchema.methods.addToCart = function addToCart(fethchedProduct) {
  const cartProductIndex = this.cart.items.findIndex(
    (lp) => lp.productId.toString() === fethchedProduct._id.toString()
  );

  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    /* empty */
  } else {
    updatedCartItems.push({
      productId: fethchedProduct._id
    });
  }

  const updatedCart = {
    items: updatedCartItems
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function removeFromCart(productId) {
  const updatedCartItems = this.cart.items.filter(
    (item) => item.productId.toString() !== productId.toString()
  );
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function clearCart() {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
