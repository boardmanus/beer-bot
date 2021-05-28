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

    static gravity_to_abv(og, g) {
        return (og - g) * 131.25;
    }

    static srm_to_rgb(srm) {
        // Returns an RGB value based on SRM
        var r = 0, g = 0, b = 0;

        if (srm >= 0 && srm <= 1) {
            r = 240;
            g = 239;
            b = 181;
        } else if (srm > 1 && srm <= 2) {
            r = 233;
            g = 215;
            b = 108;
        } else if (srm > 2) {
            // Set red decimal
            if (srm < 70.6843) {
                r = 243.8327 - 6.4040 * srm + 0.0453 * srm * srm;
            } else {
                r = 17.5014;
            }
            // Set green decimal
            if (srm < 35.0674) {
                g = 230.929 - 12.484 * srm + 0.178 * srm * srm;
            } else {
                g = 12.0382;
            }
            // Set blue decimal
            if (srm < 4) {
                b = -54 * srm + 216;
            } else if (srm >= 4 && srm < 7) {
                b = 0;
            } else if (srm >= 7 && srm < 9) {
                b = 13 * srm - 91;
            } else if (srm >= 9 && srm < 13) {
                b = 2 * srm + 8;
            } else if (srm >= 13 && srm < 17) {
                b = -1.5 * srm + 53.5;
            } else if (srm >= 17 && srm < 22) {
                b = 0.6 * srm + 17.8;
            } else if (srm >= 22 && srm < 27) {
                b = -2.2 * srm + 79.4;
            } else if (srm >= 27 && srm < 34) {
                b = -0.4285 * srm + 31.5714;
            } else {
                b = 17;
            }
        }

        return [r, g, b];
    }
}

module.exports = Utils;