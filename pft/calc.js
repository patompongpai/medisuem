// PFT reference calculations — GLI Global 2022, GLI-2012 (SE Asian), Siriraj 2000, GLI TLCO 2017, GLI lung volumes 2021
// sex: 'M' | 'F'; age: years; ht: cm
var PFTCalc = (function () {
  var G = null;
  function init(data) { G = data; }

  function interp(arr, age0, age) {
    if (!arr) return 0;
    var x = (age - age0) / 0.25, i = Math.floor(x);
    if (i < 0) return arr[0];
    if (i >= arr.length - 1) return arr[arr.length - 1];
    var f = x - i;
    return arr[i] + (arr[i + 1] - arr[i]) * f;
  }
  function lmsOut(L, M, S, obs) {
    var lln = M * Math.pow(1 - 1.644854 * L * S, 1 / L);
    var uln = M * Math.pow(1 + 1.644854 * L * S, 1 / L);
    var z = (obs == null || isNaN(obs)) ? null : (Math.pow(obs / M, L) - 1) / (L * S);
    return { pred: M, lln: lln, uln: uln, z: z, pp: obs == null || isNaN(obs) ? null : 100 * obs / M };
  }
  var ln = Math.log;

  // ---- GLI Global 2022 (Bowerman AJRCCM 2023) ----
  var GG = {
    M: { FEV1: [-11.399108, 2.462664, -0.011394, -2.256278, 0.080729, function () { return 1.22703; }],
         FVC: [-12.629131, 2.727421, 0.009174, -2.195595, 0.068466, function () { return 0.9346; }],
         FEV1FVC: [1.022608, -0.218592, -0.027586, -2.882025, 0.068889, function (a) { return 3.8243 - 0.3328 * ln(a); }] },
    F: { FEV1: [-10.901689, 2.385928, -0.076386, -2.364047, 0.129402, function () { return 1.21388; }],
         FVC: [-12.055901, 2.621579, -0.035975, -2.310148, 0.120428, function () { return 0.899; }],
         FEV1FVC: [0.9189568, -0.1840671, -0.0461306, -3.171582, 0.144358, function (a) { return 6.6490 - 0.9920 * ln(a); }] }
  };
  function gliGlobal(sex, age, ht, p, obs) {
    var c = GG[sex][p], t = G.gliGlobal[sex][p];
    if (!c || age < 3 || age > 95) return null;
    var M = Math.exp(c[0] + c[1] * ln(ht) + c[2] * ln(age) + interp(t.M, t.age0, age));
    var S = Math.exp(c[3] + c[4] * ln(age) + interp(t.S, t.age0, age));
    return lmsOut(c[5](age), M, S, obs);
  }

  // ---- GLI-2012 South East Asian (Quanjer ERJ 2012) ----
  function gli2012SEA(sex, age, ht, p, obs) {
    var t = G.gli2012[sex][p];
    if (!t || age < 3 || age > 95) return null;
    var k = t.coef;
    var L = k.q0 + k.q1 * ln(age) + interp(t.l0, t.age0, age);
    var M = Math.exp(k.a0 + k.a1 * ln(ht) + k.a2 * ln(age) + k.a5 + interp(t.m0, t.age0, age));
    var S = Math.exp(k.p0 + k.p1 * ln(age) + k.p4 + interp(t.s0, t.age0, age));
    return lmsOut(L, M, S, obs);
  }

  // ---- Siriraj 2000 (Dejsomritrutai, JMAT 2000;83:457-66) ----
  // terms: [const, A, A2, H, H2, AH], SEE ; FEV1FVC in %
  var SR = {
    M: { FVC: [[-2.601, 0.122, -0.00046, 0, 0.00023, -0.00061], 0.434],
         FEV1: [[-7.697, 0.123, -0.00034, 0.067, 0, -0.0007], 0.371],
         FEF2575: [[-19.049, 0.201, -0.00042, 0.207, -0.00039, -0.0012], 0.882],
         PEF: [[-16.859, 0.307, -0.0018, 0.141, 0, -0.001], 1.543],
         FEV1FVC: [[19.362, 0.49, 0, 0.829, -0.0023, -0.0041], 5.364] },
    F: { FVC: [[-5.914, 0.088, -0.0003, 0.056, 0, -0.0005], 0.324],
         FEV1: [[-10.603, 0.085, -0.00019, 0.12, -0.00022, -0.00056], 0.275],
         FEF2575: [[-21.528, 0.11, -0.00017, 0.272, -0.0007, -0.00082], 0.664],
         PEF: [[-31.355, 0.162, -0.00084, 0.391, -0.00099, -0.00072], 1.117],
         FEV1FVC: [[83.126, 0.243, 0.002, 0.08, 0, -0.0036], 4.986] }
  };
  function siriraj(sex, age, ht, p, obs) {
    var e = SR[sex][p];
    if (!e || age < 10) return null;
    var b = e[0], see = e[1];
    var pred = b[0] + b[1] * age + b[2] * age * age + b[3] * ht + b[4] * ht * ht + b[5] * age * ht;
    if (p === 'FEV1FVC') { pred = pred / 100; see = see / 100; }
    return { pred: pred, lln: pred - 1.645 * see, uln: pred + 1.645 * see,
      z: (obs == null || isNaN(obs)) ? null : (obs - pred) / see,
      pp: (obs == null || isNaN(obs)) ? null : 100 * obs / pred, linear: true };
  }

  // ---- GLI TLCO 2017 (traditional units: mL/min/mmHg, mL/min/mmHg/L, L) ----
  var TL = {
    M: { TLCO: [-7.034920, 2.018368, -0.012425, -1.98996, 0.03536, 0.39482],
         KCO: [4.088408, -0.415334, -0.113166, -1.98186, 0.01460, 0.67330],
         VA: [-11.086573, 2.430021, 0.097047, -2.20953, 0.01937, 0.62559] },
    F: { TLCO: [-5.159451, 1.618697, -0.015390, -1.82905, -0.01815, 0.24160],
         KCO: [5.131492, -0.645656, -0.097395, -1.63787, -0.07757, 0.48963],
         VA: [-9.873970, 2.182316, 0.082868, -2.08839, -0.01334, 0.51919] }
  };
  function gliTLCO(sex, age, ht, p, obs) {
    var c = TL[sex][p], t = G.gliTLCO[sex][p];
    if (!c || age < 5 || age > 90) return null;
    var M = Math.exp(c[0] + c[1] * ln(ht) + c[2] * ln(age) + interp(t.M, t.age0, age));
    var S = Math.exp(c[3] + c[4] * ln(age) + interp(t.S, t.age0, age));
    return lmsOut(c[5], M, S, obs);
  }

  // ---- GLI static lung volumes 2021 (Hall ERJ 2021) ----
  function gliVol(sex, age, ht, p, obs) {
    var t = G.gliVol[sex][p];
    if (!t || age < 5 || age > 80) return null;
    var a = age, h = ht, M, S, L, ms = interp(t.M, t.age0, a), ss = interp(t.S, t.age0, a);
    var m = sex === 'M';
    switch (p) {
      case 'FRC': M = m ? Math.exp(-13.4898 + 0.1111 * ln(a) + 2.7634 * ln(h) + ms) : Math.exp(-12.7674 + 0.1251 * ln(a) + 2.6049 * ln(h) + ms);
        S = m ? Math.exp(-1.60197 + 0.01513 * ln(a) + ss) : Math.exp(-1.48310 - 0.03372 * ln(a) + ss); L = m ? 0.3416 : 0.2898; break;
      case 'TLC': M = m ? Math.exp(-10.5861 + 0.1433 * ln(a) + 2.3155 * ln(h) + ms) : Math.exp(-10.1128 + 0.1062 * ln(a) + 2.2259 * ln(h) + ms);
        S = m ? Math.exp(-2.0616143 - 0.0008534 * a + ss) : Math.exp(-2.0999321 + 0.0001564 * a + ss); L = m ? 0.9337 : 0.4636; break;
      case 'RV': M = m ? Math.exp(-2.37211 + 0.01346 * a + 0.01307 * h + ms) : Math.exp(-2.50593 + 0.01307 * a + 0.01379 * h + ms);
        S = m ? Math.exp(-0.878572 - 0.007032 * a + ss) : Math.exp(-0.902550 - 0.006005 * a + ss); L = m ? 0.5931 : 0.4197; break;
      case 'RVTLC': M = m ? Math.exp(2.634 + 0.01302 * a - 0.00008862 * h + ms) : Math.exp(2.666 + 0.01411 * a - 0.00003689 * h + ms);
        S = m ? Math.exp(-0.96804 - 0.01004 * a + ss) : Math.exp(-0.976602 - 0.009679 * a + ss); L = m ? 0.8646 : 0.8037; break;
      case 'VC': M = m ? Math.exp(-10.134371 - 0.003532 * a + 2.307980 * ln(h) + ms) : Math.exp(-9.230600 - 0.005517 * a + 2.116822 * ln(h) + ms);
        S = m ? Math.exp(-2.1367411 + 0.0009367 * a) : Math.exp(-2.220260 + 0.002956 * a); L = m ? 0.8611 : 1.038; break;
      default: return null;
    }
    return lmsOut(L, M, S, obs);
  }

  return { init: init, gliGlobal: gliGlobal, gli2012SEA: gli2012SEA, siriraj: siriraj, gliTLCO: gliTLCO, gliVol: gliVol };
})();
if (typeof module !== 'undefined') module.exports = PFTCalc;
