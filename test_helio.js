import { Body, MakeTime, HelioVector } from 'astronomy-engine';

const time = MakeTime(new Date());

const bodies = [
    Body.Mercury, Body.Venus, Body.Earth, Body.Mars,
    Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune, Body.Pluto
];

bodies.forEach(b => {
    const vec = HelioVector(b, time);
    console.log(`${b}: x=${vec.x.toFixed(3)} y=${vec.y.toFixed(3)} z=${vec.z.toFixed(3)} dist=${vec.Length().toFixed(3)} AU`);
});
