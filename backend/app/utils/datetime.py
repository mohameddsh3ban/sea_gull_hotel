from datetime import datetime, timedelta, timezone, time as dt_time
from dateutil import tz

def get_local_timezone(timezone_str: str = "Africa/Cairo"):
    """Returns a timezone object for the given string."""
    return tz.gettz(timezone_str)

def get_utc_now():
    """Returns the current UTC datetime."""
    return datetime.now(timezone.utc)

def get_local_now(timezone_str: str = "Africa/Cairo"):
    """Returns the current local datetime."""
    return datetime.now(tz=get_local_timezone(timezone_str))

def parse_date_time_local(date_str: str, time_str: str, timezone_str: str = "Africa/Cairo"):
    """Parses date and time strings into a timezone-aware local datetime."""
    year, month, day = map(int, date_str.split("-"))
    hour, minute = map(int, time_str.split(":"))
    local_tz = get_local_timezone(timezone_str)
    return datetime(year, month, day, hour, minute, tzinfo=local_tz)
