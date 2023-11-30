/* eslint-disable no-console */
/**
 * @returns {Promise<{
 *   status: 'on' | 'off' | 'starting',
 * }>}
 */
async function getServiceDetails() {
  const response = await fetch('/api/service');
  const serviceDetails = await response.json();
  return serviceDetails;
}

/**
 * @param {"off" | "on" | "starting"} status
 */
async function setServiceStatus(status) {
  const statusPill = document.getElementById('service-status');
  const powerButton = document.getElementById('power-button');
  if (statusPill && powerButton) {
    if (status === 'on') {
      statusPill.innerText = 'Running';
      powerButton.innerText = 'Power Off';
      powerButton.removeAttribute('disabled');
    } else if (status === 'off') {
      statusPill.innerText = 'Stopped';
      powerButton.innerText = 'Power On';
      powerButton.removeAttribute('disabled');
    } else if (status === 'starting') {
      statusPill.innerText = 'Starting...';
      powerButton.innerText = 'Starting...';
      powerButton.setAttribute('disabled', 'true');
    }
    powerButton.onclick = async () => {
      const serviceDetails = await getServiceDetails();
      if (serviceDetails.status === 'on') {
        await fetch('/api/service', {
          method: 'POST',
          body: JSON.stringify({
            action: 'stop',
          }),
        });
        setServiceStatus('off');
      } else if (serviceDetails.status === 'off') {
        await fetch('/api/service', {
          method: 'POST',
          body: JSON.stringify({
            action: 'start',
          }),
        });
        setServiceStatus('starting');
      }
    };
  }
}

// refresh server status regularly
/** @type {NodeJS.Timer} */
let timeout;
async function refreshServiceStatus() {
  try {
    const serviceDetails = await getServiceDetails();
    await setServiceStatus(serviceDetails.status);
  } catch (err) {
    console.error(err);
    clearInterval(timeout);
  }
}
timeout = setInterval(refreshServiceStatus, 15000);
await refreshServiceStatus();
