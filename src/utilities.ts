export const isJSONString = (str: string) => {
	try {
		JSON.parse(str);
		return true;
	} catch (error) {
		return false;
	}
};

export const dateToMillis = (initDate: string) => {
	const date = new Date(initDate);
	const timestamp = date.getTime();

	return timestamp;
};

export const millisToFileNameDate = (milliseconds: number) => {
	const date = new Date(milliseconds);

	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
	const year = date.getFullYear().toString().slice(-2);
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const seconds = date.getSeconds().toString().padStart(2, "0");

	return `${day}${month}${year}_${hours}-${minutes}-${seconds}`;
};
