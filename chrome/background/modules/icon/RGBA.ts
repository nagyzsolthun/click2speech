export default class RGBA {

    private constructor(public r: number, public g: number, public b: number, public a: number) { }

    static create(c: { r?: number, g?: number, b?: number, a?: number }): RGBA {
        const r = c.r || 0;
        const g = c.g || 0;
        const b = c.b || 0;
        const a = (c.a != null) ? c.a : 1; //if c.a is zero, we want to keep it as is
        return new RGBA(r, g, b, a);
    };

    static mix(c1: RGBA, c2: RGBA, w1: number, w2: number): RGBA {
        if (c1 == RGBA.TRANSPARENT && c2 == RGBA.TRANSPARENT) {
            return RGBA.TRANSPARENT;
        }
        c1 = c1 || RGBA.create({ r: c2.r, g: c2.g, b: c2.b, a: 0 }); // null source is transparent target
        c2 = c2 || RGBA.create({ r: c1.r, g: c1.g, b: c1.b, a: 0 }); // null target is transparent source

        var result = {};
        const r = (c1.r * w1 + c2.r * w2) / (w1 + w2);
        const g = (c1.g * w1 + c2.g * w2) / (w1 + w2);
        const b = (c1.b * w1 + c2.b * w2) / (w1 + w2);
        const a = (c1.a * w1 + c2.a * w2) / (w1 + w2);
        return RGBA.create({ r, g, b, a });
    };

    static BLACK = RGBA.create({});
    static TRANSPARENT: RGBA = null;
}
