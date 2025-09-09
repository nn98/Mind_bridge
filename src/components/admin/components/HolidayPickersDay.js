// src/components/admin/components/HolidayPickersDay.js
import {styled} from "@mui/material/styles";
import {PickersDay} from "@mui/x-date-pickers";

const HolidayPickersDay = styled(PickersDay, {
    shouldForwardProp: (prop) =>
        prop !== "isHolidayKR" &&
        prop !== "isSunday" &&
        prop !== "isSaturday" &&
        prop !== "outsideCurrentMonth",
})(({isHolidayKR, isSunday, isSaturday, outsideCurrentMonth}) => ({
    // 주말/공휴일 색상
    color: isHolidayKR || isSunday ? "red" : isSaturday ? "blue" : undefined,


    // 이번 달이 아닌 날짜 흐리게 표시
    opacity: outsideCurrentMonth ? 0.4 : 1,
}));

export default HolidayPickersDay;
