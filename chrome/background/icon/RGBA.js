function create(c) {
    var rgba = {
        r: c.r || 0,
        g: c.g || 0,
        b: c.b || 0,
        a: (c.a != null) ? c.a : 1, //if c.a is zero, we want to keep it as is
    }
    return rgba;
};

function mix(c1, c2, w1, w2) {
    if (c1 == TRANSPARENT && c2 == TRANSPARENT) {
        return TRANSPARENT;
    }
    c1 = c1 || create({ r: c2.r, g: c2.g, b: c2.b, a: 0 }); //null source is transparent target
    c2 = c2 || create({ r: c1.r, g: c1.g, b: c1.b, a: 0 }); //null target is transparent source

    var result = {};
    result.r = (c1.r * w1 + c2.r * w2) / (w1 + w2);
    result.g = (c1.g * w1 + c2.g * w2) / (w1 + w2);
    result.b = (c1.b * w1 + c2.b * w2) / (w1 + w2);
    result.a = (c1.a * w1 + c2.a * w2) / (w1 + w2);
    return result;
};

const BLACK = create({});
const TRANSPARENT = null;

export { create, mix, BLACK, TRANSPARENT }
