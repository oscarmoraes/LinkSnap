/**
 * Gerador de Payload Oficial Pix (BR Code / EMVCo) do Banco Central do Brasil
 */

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixParams {
  key: string;
  name: string;
  city?: string;
  amount?: number | string;
  txid?: string;
}

export function generatePixPayload({
  key,
  name,
  city = "BRASIL",
  amount,
  txid = "***",
}: PixParams): string {
  // Limpeza de caracteres especiais
  const cleanKey = key.trim();
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .substring(0, 25);
  const cleanCity = (city || "BRASIL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .substring(0, 15);
  const cleanTxid = txid
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 25) || "***";

  // Merchant Account Information (GUI + Key)
  const gui = formatField("00", "br.gov.bcb.pix");
  const keyField = formatField("01", cleanKey);
  const merchantAccount = formatField("26", `${gui}${keyField}`);

  // Base do payload
  let payload =
    formatField("00", "01") + // Payload Format Indicator
    merchantAccount +
    formatField("52", "0000") + // Merchant Category Code
    formatField("53", "986"); // Currency (986 = BRL)

  // Valor opcional
  if (amount !== undefined && amount !== null && amount !== "") {
    const numAmount = typeof amount === "string" ? parseFloat(amount.replace(",", ".")) : amount;
    if (!isNaN(numAmount) && numAmount > 0) {
      payload += formatField("54", numAmount.toFixed(2));
    }
  }

  payload +=
    formatField("58", "BR") + // Country Code
    formatField("59", cleanName || "BENEFICIARIO") + // Merchant Name
    formatField("60", cleanCity || "BRASIL"); // Merchant City

  // Additional Data (TxID)
  const additionalData = formatField("05", cleanTxid);
  payload += formatField("62", additionalData);

  // Início do campo CRC16
  payload += "6304";
  const checksum = crc16(payload);

  return `${payload}${checksum}`;
}
