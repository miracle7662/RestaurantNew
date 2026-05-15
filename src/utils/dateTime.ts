// utils/dateTime.js

export const getMySQLDateTime = (dateValue = null) => {
  const selectedDate = dateValue ? new Date(dateValue) : new Date();
  const currentTime = new Date();

  selectedDate.setHours(
    currentTime.getHours(),
    currentTime.getMinutes(),
    currentTime.getSeconds()
  );

  return (
    selectedDate.getFullYear() +
    "-" +
    String(selectedDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(selectedDate.getDate()).padStart(2, "0") +
    " " +
    String(selectedDate.getHours()).padStart(2, "0") +
    ":" +
    String(selectedDate.getMinutes()).padStart(2, "0") +
    ":" +
    String(selectedDate.getSeconds()).padStart(2, "0")
  );
};