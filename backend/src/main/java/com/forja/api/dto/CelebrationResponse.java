package com.forja.api.dto;

import com.forja.api.dto.DashboardResponse.Level;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Celebration", description = "Milestones reached by the action that returned it.")
public record CelebrationResponse(
		@Schema(description = "The level just reached; null if the level did not change.") Level newLevel,
		@Schema(description = "The module just completed; null if none.") ModuleRefResponse completedModule) {
}
