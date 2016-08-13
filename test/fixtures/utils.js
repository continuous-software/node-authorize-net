
module.exports = {
	randomAmount: randomAmount,
};

function randomAmount(max, min) {
  min = min || 0.01;
  return (Math.random() * ((max || 300) - min) + min).toFixed(2);
}
