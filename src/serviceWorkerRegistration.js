const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(config) {
  if (
    process.env.NODE_ENV === "production" &&
    "serviceWorker" in navigator
  ) {
    const publicUrl = new URL(
      process.env.PUBLIC_URL,
      window.location.href
    );

    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener("load", () => {
      const serviceWorkerUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(serviceWorkerUrl, config);

        navigator.serviceWorker.ready.then(() => {
          console.log(
            "Secure Chat is running with a service worker."
          );
        });
      } else {
        registerValidServiceWorker(
          serviceWorkerUrl,
          config
        );
      }
    });
  }
}

function registerValidServiceWorker(
  serviceWorkerUrl,
  config
) {
  navigator.serviceWorker
    .register(serviceWorkerUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker =
          registration.installing;

        if (!installingWorker) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (
            installingWorker.state !== "installed"
          ) {
            return;
          }

          if (navigator.serviceWorker.controller) {
            console.log(
              "New Secure Chat content is available."
            );

            if (config?.onUpdate) {
              config.onUpdate(registration);
            }
          } else {
            console.log(
              "Secure Chat is available for offline use."
            );

            if (config?.onSuccess) {
              config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error(
        "Service worker registration failed:",
        error
      );
    });
}

function checkValidServiceWorker(
  serviceWorkerUrl,
  config
) {
  fetch(serviceWorkerUrl, {
    headers: {
      "Service-Worker": "script",
    },
  })
    .then((response) => {
      const contentType =
        response.headers.get("content-type");

      if (
        response.status === 404 ||
        (contentType &&
          !contentType.includes("javascript"))
      ) {
        navigator.serviceWorker.ready
          .then((registration) => {
            return registration.unregister();
          })
          .then(() => {
            window.location.reload();
          });

        return;
      }

      registerValidServiceWorker(
        serviceWorkerUrl,
        config
      );
    })
    .catch(() => {
      console.log(
        "No internet connection. Secure Chat is running offline."
      );
    });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}