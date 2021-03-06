import React from "react";
import CollectionTable from "../collection/CollectionTable";
import { RouteComponentProps } from "react-router";
import { Entity, EntityCollectionView, EntitySchema } from "../models";
import {
    BreadcrumbEntry,
    getEntityPath,
    getRouterNewEntityPath,
    replacePathIdentifiers
} from "./navigation";
import {
    Box,
    Breadcrumbs,
    Button,
    Grid,
    Link,
    Typography
} from "@material-ui/core";
import { Link as ReactLink } from "react-router-dom";
import { BreadcrumbContainer } from "../util";
import DeleteEntityDialog from "../collection/DeleteEntityDialog";
import EntityDetailDialog from "../preview/EntityDetailDialog";

interface CollectionRouteProps<S extends EntitySchema> {
    view: EntityCollectionView<S>;
    entityPlaceholderPath: string,
    breadcrumbs: BreadcrumbEntry[]
}

export function CollectionRoute<S extends EntitySchema>({
                                                            view,
                                                            entityPlaceholderPath,
                                                            breadcrumbs,
                                                            match,
                                                            history
                                                        }
                                                            : CollectionRouteProps<S> & RouteComponentProps) {
    let collectionPath: string;

    if (match) {
        collectionPath = replacePathIdentifiers(match.params, entityPlaceholderPath);
    } else {
        throw Error("No match prop for some reason");
    }

    const [entityClicked, setEntityClicked] = React.useState<Entity<S> | undefined>(undefined);
    const [deleteEntityClicked, setDeleteEntityClicked] = React.useState<Entity<S> | undefined>(undefined);

    function onEntityEdit(collectionPath: string, entity: Entity<S>) {
        const entityPath = getEntityPath(entity.id, collectionPath);
        history.push(entityPath);
    }

    const onEntityClick = (collectionPath: string, entity: Entity<S>) => {
        setEntityClicked(entity);
    };

    const onEntityDelete = (collectionPath: string, entity: Entity<S>) => {
        setDeleteEntityClicked(entity);
    };

    const deleteEnabled = view.deleteEnabled === undefined || view.deleteEnabled;
    return (
        <React.Fragment>

            <Box mb={3}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <BreadcrumbContainer>
                            <Breadcrumbs aria-label="breadcrumb">
                                <Link color="inherit" component={ReactLink}
                                      to="/">
                                    Home
                                </Link>
                                <Typography
                                    color="textPrimary">{view.schema.name}</Typography>
                            </Breadcrumbs>
                        </BreadcrumbContainer>
                    </Grid>
                    <Grid item xs={6}>
                        <Box textAlign="right">
                            <Button
                                component={ReactLink}
                                to={getRouterNewEntityPath(collectionPath)}
                                size="large"
                                variant="contained"
                                color="primary"
                            >
                                Add {view.schema.name}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <CollectionTable collectionPath={view.relativePath}
                             schema={view.schema}
                             textSearchDelegate={view.textSearchDelegate}
                             includeToolbar={true}
                             onEntityEdit={onEntityEdit}
                             onEntityClick={onEntityClick}
                             onEntityDelete={deleteEnabled ? onEntityDelete : undefined}
                             additionalColumns={view.additionalColumns}
                             small={view.small === undefined ? false : view.small}
                             paginationEnabled={view.pagination === undefined ? true : view.pagination}
                             filterableProperties={view.filterableProperties}
                             properties={view.properties}/>

            {entityClicked &&
            <EntityDetailDialog entity={entityClicked}
                                schema={view.schema}
                                open={!!entityClicked}
                                onClose={() => setEntityClicked(undefined)}/>}

            {deleteEntityClicked &&
            <DeleteEntityDialog entity={deleteEntityClicked}
                                schema={view.schema}
                                open={!!deleteEntityClicked}
                                onClose={() => setDeleteEntityClicked(undefined)}/>}

        </React.Fragment>
    );
}
