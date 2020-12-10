function executeScene(installedAppId, sceneId, callback) {
	$.post(`/isa/${installedAppId}/scenes/${sceneId}`, {}, callback);
}

function executeCommand(installedAppId, deviceId, capability, command) {
	$.ajax({
		type: 'POST',
		url: `/isa/${installedAppId}/devices/${deviceId}`,
		headers: {
			'Content-Type': 'application/json'
		},
		data: JSON.stringify({
			component: 'main',
			capability,
			command
		}),
		dataType: 'json'
	});
}
