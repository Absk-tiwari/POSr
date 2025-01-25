const normalizeSpaces = (str) => {
    return str.replace(/\s+/g, ' ').trim();
}

export const getCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0'); // Add leading zero if needed
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
};

export default { normalizeSpaces };