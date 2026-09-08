export function navigationGuardSource(): string {
  return `function routeKey(route) {
  return JSON.stringify([route?.page, Object.entries(route?.params ?? {}).sort(([left], [right]) => left.localeCompare(right))]);
}

export function createNavigationGuard({ hasPendingChanges, decide, navigate }) {
  let version = 0;
  let pending;
  let authorized;
  let disposed = false;

  return {
    interceptor(navigation) {
      const key = routeKey(navigation.to);
      if (disposed || routeKey(navigation.from) === key) return { intercept: false };
      if (authorized === key) {
        authorized = undefined;
        return { intercept: false };
      }
      authorized = undefined;
      version += 1;
      pending = undefined;
      if (!hasPendingChanges()) return { intercept: false };
      pending = {
        version,
        key,
        from: routeKey(navigation.from),
        target: structuredClone({ page: navigation.to.page, params: navigation.to.params ?? {} }),
        started: false,
      };
      return { intercept: true };
    },

    async handleIntercepted(navigation) {
      const request = pending;
      if (disposed || !request || request.started || request.key !== routeKey(navigation.to) || request.from !== routeKey(navigation.from)) return;
      request.started = true;
      let decision;
      try {
        decision = await decide({ target: structuredClone(request.target), hasPendingChanges: true });
      } catch {
        decision = { action: 'cancel', reason: 'confirmation-unavailable' };
      }
      if (disposed || version !== request.version) return;
      pending = undefined;
      if (decision?.action !== 'allow') return decision;
      authorized = request.key;
      try {
        await navigate(request.target.page, structuredClone(request.target.params));
      } catch (error) {
        if (authorized === request.key) authorized = undefined;
        throw error;
      }
      return decision;
    },

    dispose() {
      disposed = true;
      version += 1;
      pending = undefined;
      authorized = undefined;
    },
  };
}
`;
}
