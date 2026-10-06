package com.forja.api.service;

import com.forja.api.dto.DashboardResponse;
import java.time.ZoneId;

public interface DashboardService {

	/** @param zone the learner's time zone, which decides where each day of the streak starts */
	DashboardResponse build(Long userId, ZoneId zone);

}
