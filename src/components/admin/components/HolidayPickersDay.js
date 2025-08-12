import { styled } from "@mui/material/styles";
import { PickersDay } from "@mui/x-date-pickers";

const HolidayPickersDay = styled(PickersDay, {
    shouldForwardProp: (prop) =>
        prop !== "isHolidayKR" && prop !== "isSunday" && prop !== "isSaturday",
})(({ isHolidayKR, isSunday, isSaturday }) => ({
    color: isHolidayKR || isSunday ? "red" : isSaturday ? "blue" : undefined,
    fontWeight: isHolidayKR ? "bold" : undefined,
}));

export default HolidayPickersDay;
