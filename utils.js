class Utils {
    
    static f_to_c(f) {
        return (f - 32.0) * 5.0/9.0;
    }
    
    static c_to_f(c) {
        return c*9.0/5.0 + 32.0;
    }    
    
    static low_pass_filter(x1, xf0, dt, rc) {
        const alpha = dt / (rc + dt);
        const xf1 = xf0 + alpha * (x1 - xf0);
        return xf1;
    }

    static noise(factor) {
        return (Math.random() - 0.5)*factor;
    }
}

module.exports = Utils;