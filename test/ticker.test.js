const expect = require('chai').expect;
const percent = require('../ticker').calculatePercent;
const currency = require('../ticker').convertCurrency;

describe('Calculate percentage', () => {
    it('Should return a number type', () => {
        expect(percent(100, 10)).to.be.a('number');
    });
    it('Should calculate and return a percentage', () => {
        expect(percent(100, 10)).to.equal(10);
    });
});

describe('Convert currency', () => {
    it('Should return a formated currency value', () => {
        expect(currency(3000, 100)).to.equal(300000);
    });
});
