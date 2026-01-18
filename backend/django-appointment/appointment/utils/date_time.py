"""
Clean DateTime utilities
Author: Miquel Barón
Since: 1.0.0
"""

import datetime
from django.utils import timezone


# ------------------- COMBINE / CONVERT -------------------

def combine_date_and_time(date: datetime.date, time: datetime.time) -> datetime.datetime:
    """Combine a date and a time into a datetime object."""
    return datetime.datetime.combine(date, time)


def convert_12_hour_time_to_24_hour_time(time_to_convert) -> str:
    """Convert 12-hour format (e.g., '10:30 AM') to 24-hour format ('HH:MM:SS')."""
    if isinstance(time_to_convert, (datetime.time, datetime.datetime)):
        return time_to_convert.strftime('%H:%M:%S')
    elif isinstance(time_to_convert, str):
        time_str = time_to_convert.strip().upper()
        return datetime.datetime.strptime(time_str, '%I:%M %p').strftime('%H:%M:%S')
    else:
        raise ValueError(f"Unsupported type for conversion: {type(time_to_convert)}")


def convert_24_hour_time_to_12_hour_time(time_to_convert) -> str:
    """Convert 24-hour time ('HH:MM[:SS]') to 12-hour format ('HH:MM AM/PM')."""
    if isinstance(time_to_convert, datetime.time):
        return time_to_convert.strftime('%I:%M %p')
    for source_fmt, dest_fmt in zip(['%H:%M:%S', '%H:%M'], ['%I:%M:%S %p', '%I:%M %p']):
        try:
            parsed_time = datetime.datetime.strptime(time_to_convert, source_fmt)
            return parsed_time.strftime(dest_fmt)
        except ValueError:
            continue
    raise ValueError(f"Invalid 24-hour time format: {time_to_convert}")


def convert_str_to_time(time_str: str) -> datetime.time:
    """Convert a string to a Python `time` object. Supports 12h and 24h formats."""
    formats = ["%I:%M %p", "%H:%M:%S", "%H:%M"]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(time_str.strip().upper(), fmt).time()
        except ValueError:
            continue
    raise ValueError(f"Invalid time format: {time_str}")


def convert_str_to_date(date_str: str) -> datetime.date:
    """Convert a string to a Python `date` object. Supports YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD."""
    for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d']:
        try:
            return datetime.datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Invalid date format: {date_str}")


# ------------------- CALCULATIONS -------------------

def get_ar_end_time(start_time, duration) -> datetime.time:
    """
    Get end time from start_time and duration (minutes or timedelta).
    Wraps around midnight if necessary.
    """
    if isinstance(start_time, str):
        start_time = convert_str_to_time(start_time)
    dt_start = datetime.datetime.combine(datetime.date.today(), start_time)

    if isinstance(duration, datetime.timedelta):
        duration_minutes = duration.total_seconds() / 60
    else:
        duration_minutes = int(duration)

    dt_end = dt_start + datetime.timedelta(minutes=duration_minutes)

    if dt_end.day > dt_start.day:
        dt_end -= datetime.timedelta(days=1)

    return dt_end.time()


def time_difference(time1, time2) -> datetime.timedelta:
    """Return the difference between two times (datetime.time or datetime.datetime)."""
    if isinstance(time1, datetime.time) and isinstance(time2, datetime.time):
        today = datetime.date.today()
        dt1 = datetime.datetime.combine(today, time1)
        dt2 = datetime.datetime.combine(today, time2)
    elif isinstance(time1, datetime.datetime) and isinstance(time2, datetime.datetime):
        dt1, dt2 = time1, time2
    else:
        raise ValueError("Inputs must be both datetime.time or both datetime.datetime.")

    if dt2 < dt1:
        raise ValueError("time2 must be later than time1.")
    return dt2 - dt1


# ------------------- UTILS -------------------

def get_timestamp() -> str:
    """Return current timestamp as string without decimal point."""
    return str(timezone.now().timestamp()).replace('.', '')


def get_current_year() -> int:
    return datetime.datetime.now().year


def get_weekday_num(weekday: str) -> int:
    """Return weekday number: Monday=0, Sunday=6."""
    weekdays = {
        'monday': 0,
        'tuesday': 1,
        'wednesday': 2,
        'thursday': 3,
        'friday': 4,
        'saturday': 5,
        'sunday': 6
    }
    return weekdays.get(weekday.lower(), -1)
