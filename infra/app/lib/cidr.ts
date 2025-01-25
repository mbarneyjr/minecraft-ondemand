import ip6 from 'ip6';

/**
 * @param {string} cidrBlock a CIDR block (10.0.0.0/16)
 * @param {number} subnetMask the subnet mask (24)
 * @returns {string[]} an array of subnet CIDR blocks
 */
export function getIpv4Subnets(cidrBlock: string, subnetMask: number): Array<string> {
  const [baseIp, baseMask] = cidrBlock.split('/');
  const baseIpParts = baseIp.split('.').map(Number);
  const baseMaskInt = parseInt(baseMask, 10);
  const subnetMaskInt = subnetMask;

  const numberOfSubnets = Math.pow(2, subnetMaskInt - baseMaskInt);
  const subnetSize = Math.pow(2, 32 - subnetMaskInt);

  const subnets: string[] = [];

  for (let i = 0; i < numberOfSubnets; i++) {
    const subnetIpParts = [...baseIpParts];
    let carry = i * subnetSize;

    for (let j = 3; j >= 0; j--) {
      subnetIpParts[j] += carry % 256;
      carry = Math.floor(carry / 256);
    }

    const subnetIp = subnetIpParts.join('.');
    subnets.push(`${subnetIp}/${subnetMaskInt}`);
  }

  return subnets;
}

/**
 * @param {string} cidrBlock a CIDR block (2600:1F26:002D:0000:0000:0064:0000:0000/96)
 * @param {number} subnetMask the subnet mask (112)
 * @returns {string[]} an array of subnet CIDR blocks
 */
export function getIpv6Subnets(cidrBlock: string, subnetMask: number): Array<string> {
  const [baseIp, baseMask] = cidrBlock.split('/');
  const subnets: Array<string> = ip6
    .divideSubnet(baseIp, baseMask, subnetMask)
    .map((cidr) => `${ip6.abbreviate(cidr)}/${subnetMask}`);
  return subnets;
}
