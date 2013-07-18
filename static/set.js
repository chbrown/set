'use strict'; /*jslint browser: true, indent: 2 */ /* globals _, $ */

_.repeat = function(value, count) {
  var result = new Array(count);
  var a;
  if (value.call)
    for (a = 0; a < count; a++) result[a] = value();
  else
    for (a = 0; a < count; a++) result[a] = value;
  return result;
};
// sample WITH replacement
_.sample = function(list, count) {
  var result = new Array(count);
  for (var a = 0; a < count; a++) result[a] = list[(Math.random() * list.length) | 0];
  return result;
};
_.sliding2 = function(list) { return _.zip(list.slice(0, list.length - 1), list.slice(1)); };
_.cross = function(list) {
  var result = [];
  for (var r = 0; r < list.length - 1; r++) {
    for (var c = r + 1; c < list.length; c++) {
      result.push([list[r], list[c]]);
    }
  }
  return result;
};
_.crossProduct = function(list_a, list_b) {
  // console.log(list_a, 'x', list_b)
  return _.reduce(_.map(list_a, function(a) {
    return _.map(list_b, function(b) {
      return [a, b];
    });
  }), function(a, b) { return a.concat(b); }, []);
};
function isEqual(tuple) {
  return tuple[0] === tuple[1];
}


var dimensions = [
  ['bean', 'diamond', 'oval'],
  ['filled', 'hollow', 'shaded'],
  ['red', 'green', 'blue'],
  [1, 2, 3]
];


function Card(dimensions) {
  this.values = _.isArray(dimensions) ? dimensions : new Array(dimensions); // [shape, fill, color, number]
}
Card.prototype.valueAt = function(dim) {
   // Card(_.sample([0, 1, 2], 4))
  return this.values[dim];
};
Card.prototype.drawIn = function($elem) {
  var $card = $('<div class="card" id="' + ((Math.random() * 10000) | 0) + '"></div>').appendTo($elem);
  for (var n = 0; n <= this.values[3]; n++) {
    var $canvas = $('<canvas width="72" height="142"></canvas>').appendTo($card);
    var canvas = $canvas[0];
    var ctx = canvas.getContext("2d");
    drawShape(ctx, dimensions[0][this.values[0]], dimensions[1][this.values[1]], dimensions[2][this.values[2]]);
  }
};
Card.prototype.identical = function(other) {
  // for each of the dimensions, does this card's value[d] == that card's value[d]?
  return _.all(_.zip(this.values, other.values), function(dimension_pair) {
    return dimension_pair[0] == dimension_pair[1];
  });
};

Card.random = function() {
  return new Card(_.sample([0, 1, 2], 4));
};
Card.differences = function(cards) {
  var differences = 0;
  for (var dimension = 0; dimension < cards[0].values.length; dimension++) {
    var along = _.invoke(cards, 'valueAt', dimension);
    var all_the_same = _.all(_.sliding2(along), isEqual);
    var all_different = !_.any(_.cross(along), isEqual); // all different = NOT(any are equal)
    differences += (all_the_same || all_different) ? 0 : 1;
  }
  return differences;
};
Card.clash = function(cards) {
  // for each combination of the other cards
  for (var r = 0; r < cards.length; r++) {
    for (var c = r + 1; c < cards.length; c++) {
      // if any two are identical, return true
      if (cards[r].identical(cards[c]))
        return true;
    }
  }
  return false;
};
Card.complete = function(incompletes) {
  var values = _.map(dimensions, function(name, dimension) {
    var along = _.map(incompletes, function(card) { return card.values[dimension]; });
    var all_the_same = _.all(_.sliding2(along), isEqual);
    // var all_different = !_.any(_.cross(along), isEqual); // all different = NOT(any are equal)
    if (all_the_same)
      return along[0];
    else
      return _.difference([0, 1, 2], along);
  });
  return new Card(values);
};

function add3SetDet($container) {
  var mistakes = (Math.random() * 5) | 0;
  var mistake_dimensions = _.shuffle([0, 1, 2, 3]).slice(4 - mistakes);
  var cards = [[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]];
  for (var d = 0; d < 4; d++) {
    var choices = [0, 1, 2].shuffle();
    if (mistake_dimensions.indexOf(d) > -1) {
      // this dimension should contain a mistake: that is, 2 of one, 1 of the other
      cards[0][d] = choices[0];
      cards[1][d] = choices[0];
      cards[2][d] = choices[1];
    }
    else {
      choices = [0, 1, 2].shuffle();
      // this dimension should be well-distributed
      if (Math.random() > 0.5) {
        // this dimension should all be different
        cards[0][d] = choices[0];
        cards[1][d] = choices[1];
        cards[2][d] = choices[2];
      }
      else {
        // this dimension should all be the same
        cards[0][d] = choices[0];
        cards[1][d] = choices[0];
        cards[2][d] = choices[0];
      }
    }
  }
  cards.forEach(function(card) {
    (new Card(card)).drawIn($container);
  });
  $('#debug').html(mistakes + " mistakes");
}

function add3Set($container) {
  var mistakes = (Math.random() * 2) | 0;
  // var mistake_dimensions = [0, 1, 2, 3].shuffle().slice(4 - mistakes);

  var card_1 = Card.random(), card_2 = null, card_3 = null;
  while (card_2 === null) {
    var candidate = Card.random();
    if (!card_1.identical(candidate))
      card_2 = candidate;
  }
  for (var tries = 0; tries < 1000; tries++) {
    if (mistakes === 0)
      card_3 = Card.complete([card_1, card_2]);
    else
      card_3 = Card.random();
    if (Card.differences([card_1, card_2, card_3]) === mistakes &&
      !card_3.identical(card_1) && !card_3.identical(card_2)) {
      console.log(mistakes + " :mistakes -> tries: " + tries);
      break;
    }
    if (tries == 999) {
      console.log(mistakes + " :mistakes -> tries: " + tries + '!!!');
    }
  }
  // console.log(card_1, card_2, card_3);
  _.each([card_1, card_2, card_3], function(card) {
    card.drawIn($container);
  });
  $('#debug').html(mistakes + " mistakes");
}

function makeDeck() {
  var combinations = _.reduce(_.repeat([0, 1, 2], 3), _.crossProduct, [0, 1, 2]);
  return _.map(combinations, function(indices) {
    return new Card(_.flatten(indices));
  });
}

var paths = {
  bean: function(ctx) {
    ctx.beginPath();
    ctx.moveTo(4.6, 13.6);
    ctx.bezierCurveTo(4.6, -5.1, 62.6, -1.5, 62.6, 47.8);
    ctx.bezierCurveTo(62.6, 70.3, 54.0, 74.1, 54.0, 89.0);
    ctx.bezierCurveTo(54.0, 108.6, 67.4, 112.7, 67.4, 122.0);
    ctx.bezierCurveTo(67.4, 147.4, 6.6, 142.8, 6.6, 99.5);
    ctx.bezierCurveTo(6.6, 80.7, 19.5, 68.4, 19.5, 53.6);
    ctx.bezierCurveTo(19.5, 29.2, 4.6, 24.3, 4.6, 13.6);
    ctx.closePath();
  },
  diamond: function(ctx) {
    ctx.beginPath();
    ctx.moveTo(36.0, 4.5);
    ctx.lineTo(68.5, 70.7);
    ctx.lineTo(36.0, 136.8);
    ctx.lineTo(3.5, 70.7);
    ctx.lineTo(36.0, 4.5);
    ctx.closePath();
  },
  oval: function(ctx) {
    ctx.beginPath();
    ctx.moveTo(66.8, 104.8);
    ctx.bezierCurveTo(66.8, 122.2, 53.0, 136.3, 36.0, 136.3);
    ctx.lineTo(36.0, 136.3);
    ctx.bezierCurveTo(19.0, 136.3, 5.2, 122.2, 5.2, 104.8);
    ctx.lineTo(5.2, 36.5);
    ctx.bezierCurveTo(5.2, 19.1, 19.0, 5.0, 36.0, 5.0);
    ctx.lineTo(36.0, 5.0);
    ctx.bezierCurveTo(53.0, 5.0, 66.8, 19.1, 66.8, 36.5);
    ctx.lineTo(66.8, 104.8);
    ctx.closePath();
  }
};

// shape is either 'bean', 'diamond', or 'oval'
// fill is either 'fill', 'hollow', 'shaded'
// color is either 'red', 'green', or 'blue'
var colors = {
  red: '#D90000',
  green: '#035700',
  blue: '#3E008F'
};

function drawShape(ctx, shape, fill, color) {
  ctx.fillStyle = ctx.strokeStyle = colors[color];
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4.0;
  if (fill === 'shaded') {
    ctx.save();
    paths[shape](ctx);
    ctx.clip();
    shadePath(ctx);
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.restore();
  }
  else if (fill === 'filled') {
    ctx.save();
    paths[shape](ctx);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.lineWidth = 4.0;
  paths[shape](ctx);
  ctx.stroke();
  ctx.restore();
}

function shadePath(ctx) {
  ctx.beginPath();
  ctx.moveTo(0.0, 64.7);
  ctx.lineTo(72.0, 64.7);
  ctx.moveTo(0.0, 60.7);
  ctx.lineTo(72.0, 60.7);
  ctx.moveTo(0.0, 56.7);
  ctx.lineTo(72.0, 56.7);
  ctx.moveTo(0.0, 52.7);
  ctx.lineTo(72.0, 52.7);
  ctx.moveTo(0.0, 48.7);
  ctx.lineTo(72.0, 48.7);
  ctx.moveTo(0.0, 44.7);
  ctx.lineTo(72.0, 44.7);
  ctx.moveTo(0.0, 40.7);
  ctx.lineTo(72.0, 40.7);
  ctx.moveTo(0.0, 36.7);
  ctx.lineTo(72.0, 36.7);
  ctx.moveTo(0.0, 32.7);
  ctx.lineTo(72.0, 32.7);
  ctx.moveTo(0.0, 28.8);
  ctx.lineTo(72.0, 28.8);
  ctx.moveTo(0.0, 24.8);
  ctx.lineTo(72.0, 24.8);
  ctx.moveTo(0.0, 20.8);
  ctx.lineTo(72.0, 20.8);
  ctx.moveTo(0.0, 16.8);
  ctx.lineTo(72.0, 16.8);
  ctx.moveTo(0.0, 12.8);
  ctx.lineTo(72.0, 12.8);
  ctx.moveTo(0.0, 8.8);
  ctx.lineTo(72.0, 8.8);
  ctx.moveTo(0.0, 4.8);
  ctx.lineTo(72.0, 4.8);
  ctx.moveTo(0.0, 0.8);
  ctx.lineTo(72.0, 0.8);
  ctx.moveTo(0.0, 136.5);
  ctx.lineTo(72.0, 136.5);
  ctx.moveTo(0.0, 140.5);
  ctx.lineTo(72.0, 140.5);
  ctx.moveTo(0.0, 128.5);
  ctx.lineTo(72.0, 128.5);
  ctx.moveTo(0.0, 132.5);
  ctx.lineTo(72.0, 132.5);
  ctx.moveTo(0.0, 124.5);
  ctx.lineTo(72.0, 124.5);
  ctx.moveTo(0.0, 120.5);
  ctx.lineTo(72.0, 120.5);
  ctx.moveTo(0.0, 116.6);
  ctx.lineTo(72.0, 116.6);
  ctx.moveTo(0.0, 112.6);
  ctx.lineTo(72.0, 112.6);
  ctx.moveTo(0.0, 108.6);
  ctx.lineTo(72.0, 108.6);
  ctx.moveTo(0.0, 104.6);
  ctx.lineTo(72.0, 104.6);
  ctx.moveTo(0.0, 100.6);
  ctx.lineTo(72.0, 100.6);
  ctx.moveTo(0.0, 96.6);
  ctx.lineTo(72.0, 96.6);
  ctx.moveTo(0.0, 92.6);
  ctx.lineTo(72.0, 92.6);
  ctx.moveTo(0.0, 88.6);
  ctx.lineTo(72.0, 88.6);
  ctx.moveTo(0.0, 84.6);
  ctx.lineTo(72.0, 84.6);
  ctx.moveTo(0.0, 80.6);
  ctx.lineTo(72.0, 80.6);
  ctx.moveTo(0.0, 76.6);
  ctx.lineTo(72.0, 76.6);
  ctx.moveTo(0.0, 72.7);
  ctx.lineTo(72.0, 72.7);
  ctx.moveTo(0.0, 68.7);
  ctx.lineTo(72.0, 68.7);
}
