package com.forja.api.service.impl;

import com.forja.api.dto.LabProjectRequest;
import com.forja.api.dto.LabProjectResponse;
import com.forja.api.dto.LabProjectSummaryResponse;
import com.forja.api.dto.LabVersionResponse;
import com.forja.api.entity.LabProject;
import com.forja.api.entity.LabProjectVersion;
import com.forja.api.exception.InvalidRequestException;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.repository.LabProjectRepository;
import com.forja.api.repository.LabProjectVersionRepository;
import com.forja.api.repository.UserRepository;
import com.forja.api.service.LabProjectService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional
public class LabProjectServiceImpl implements LabProjectService {

	static final int MAX_PROJECTS = 50;

	static final int MAX_VERSIONS = 20;

	private static final String COPY_SUFFIX = " (copia)";

	private final LabProjectRepository projects;

	private final LabProjectVersionRepository versions;

	private final UserRepository users;

	private final JsonMapper json = JsonMapper.builder().build();

	public LabProjectServiceImpl(LabProjectRepository projects, LabProjectVersionRepository versions,
			UserRepository users) {
		this.projects = projects;
		this.versions = versions;
		this.users = users;
	}

	@Override
	@Transactional(readOnly = true)
	public List<LabProjectSummaryResponse> list(Long userId) {
		return projects.findByUserIdOrderByUpdatedAtDesc(userId).stream().map(LabProjectSummaryResponse::of).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public LabProjectResponse get(Long userId, Long projectId) {
		return LabProjectResponse.of(owned(userId, projectId));
	}

	@Override
	public LabProjectResponse create(Long userId, LabProjectRequest request) {
		requireRoom(userId);
		requireJson(request.content());
		LabProject project = new LabProject(users.getReferenceById(userId), request.name().strip(),
				describe(request.description()), request.mode(), request.content());
		return LabProjectResponse.of(projects.saveAndFlush(project));
	}

	@Override
	public LabProjectResponse update(Long userId, Long projectId, LabProjectRequest request) {
		requireJson(request.content());
		LabProject project = owned(userId, projectId);
		project.update(request.name().strip(), describe(request.description()), request.mode(), request.content());
		return LabProjectResponse.of(projects.saveAndFlush(project));
	}

	@Override
	public void delete(Long userId, Long projectId) {
		projects.delete(owned(userId, projectId));
	}

	@Override
	public LabProjectResponse duplicate(Long userId, Long projectId) {
		requireRoom(userId);
		LabProject source = owned(userId, projectId);
		String name = source.getName();
		int room = 120 - COPY_SUFFIX.length();
		LabProject copy = new LabProject(users.getReferenceById(userId),
				(name.length() > room ? name.substring(0, room) : name) + COPY_SUFFIX, source.getDescription(),
				source.getMode(), source.getContent());
		return LabProjectResponse.of(projects.saveAndFlush(copy));
	}

	@Override
	@Transactional(readOnly = true)
	public List<LabVersionResponse> versions(Long userId, Long projectId) {
		owned(userId, projectId);
		return versions.findByProjectIdOrderByCreatedAtDesc(projectId).stream().map(LabVersionResponse::of).toList();
	}

	@Override
	public LabVersionResponse saveVersion(Long userId, Long projectId, String label) {
		return LabVersionResponse.of(snapshot(owned(userId, projectId), label));
	}

	@Override
	public LabProjectResponse restoreVersion(Long userId, Long projectId, Long versionId) {
		LabProject project = owned(userId, projectId);
		LabProjectVersion version = versions.findByIdAndProjectId(versionId, projectId)
			.orElseThrow(() -> new ResourceNotFoundException("No existe esa versión del proyecto."));
		String restored = version.getContent();
		// Restoring is itself undoable: what was there becomes a save point.
		snapshot(project, "Antes de restaurar «%s»".formatted(version.getLabel()));
		project.restore(restored);
		return LabProjectResponse.of(projects.saveAndFlush(project));
	}

	private LabProjectVersion snapshot(LabProject project, String label) {
		String name = label == null || label.isBlank() ? "Punto de guardado" : label.strip();
		LabProjectVersion saved = versions
			.saveAndFlush(new LabProjectVersion(project, name.length() > 120 ? name.substring(0, 120) : name,
					project.getContent()));
		List<LabProjectVersion> all = versions.findByProjectIdOrderByCreatedAtDesc(project.getId());
		if (all.size() > MAX_VERSIONS) {
			versions.deleteAll(all.subList(MAX_VERSIONS, all.size()));
		}
		return saved;
	}

	/** A project of another learner is reported as missing, so ids cannot be probed. */
	private LabProject owned(Long userId, Long projectId) {
		return projects.findByIdAndUserId(projectId, userId)
			.orElseThrow(() -> new ResourceNotFoundException("No existe el proyecto con id %d.".formatted(projectId)));
	}

	private void requireRoom(Long userId) {
		if (projects.countByUserId(userId) >= MAX_PROJECTS) {
			throw new InvalidRequestException(
					"Has llegado al máximo de %d proyectos. Borra alguno para crear otro.".formatted(MAX_PROJECTS));
		}
	}

	private void requireJson(String content) {
		try {
			if (!json.readTree(content).isObject()) {
				throw new InvalidRequestException("El contenido del proyecto no tiene el formato esperado.");
			}
		}
		catch (JacksonException ex) {
			throw new InvalidRequestException("El contenido del proyecto no es JSON válido.");
		}
	}

	private static String describe(String description) {
		return description == null ? "" : description.strip();
	}

}
