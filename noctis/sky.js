(() => {
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;
  const wrap360 = value => ((value % 360) + 360) % 360;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function julianDay(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function siderealDegrees(date, longitude) {
    const days = julianDay(date) - 2451545.0;
    return wrap360(280.46061837 + 360.98564736629 * days + longitude);
  }

  function altAz(raHours, decDegrees, latitude, longitude, date) {
    const hourAngle = wrap360(siderealDegrees(date, longitude) - raHours * 15) * RAD;
    const dec = decDegrees * RAD;
    const lat = latitude * RAD;
    const east = -Math.cos(dec) * Math.sin(hourAngle);
    const north = Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.cos(hourAngle) * Math.sin(lat);
    const up = clamp(Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(hourAngle), -1, 1);
    return {alt: Math.asin(up) * DEG,az:wrap360(Math.atan2(east,north) * DEG)};
  }

  function partsFor(date, tz) {
    const formatter = new Intl.DateTimeFormat('en-GB', {timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    return Object.fromEntries(formatter.formatToParts(date).filter(p=>p.type !== 'literal').map(p=>[p.type,Number(p.value)]));
  }

  function zonedInput(date, tz) {
    const p = partsFor(date,tz);
    return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}T${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`;
  }

  function zonedToUTC(value, tz) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;
    const [,year,month,day,hour,minute] = match.map(Number);
    const wall = Date.UTC(year,month-1,day,hour,minute);
    if (!Number.isFinite(wall)) return null;
    let guess = wall;
    for (let i=0;i<4;i++) {
      const p = partsFor(new Date(guess), tz);
      const formatted = Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
      guess += wall - formatted;
    }
    const check = zonedInput(new Date(guess),tz);
    return check === value ? new Date(guess) : null;
  }

  function atLocalTime(date,tz,hour,minute=0) {
    const day = zonedInput(date,tz).slice(0,10);
    return zonedToUTC(`${day}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,tz);
  }

  function planetPositions(date, location) {
    const A = globalThis.Astronomy;
    if (!A || !A.Equator || !A.Horizon || !A.Observer) return [];
    const observer = new A.Observer(location.lat,location.lon,0);
    return globalThis.NoctisData.planets.flatMap(planet => {
      try {
        const coordinates = A.Equator(planet.body,date,observer,true,true);
        const horizon = A.Horizon(date,observer,coordinates.ra,coordinates.dec,'normal');
        return [{...planet,id:`planet-${planet.body.toLowerCase()}`,type:'planeta',ra:coordinates.ra,dec:coordinates.dec,alt:horizon.altitude,az:horizon.azimuth,description:`Posição calculada para ${date.toISOString()}.`}];
      } catch(e) { return []; }
    });
  }

  globalThis.NoctisSky = {julianDay,siderealDegrees,altAz,zonedInput,zonedToUTC,atLocalTime,planetPositions,wrap360,clamp};
})();
